import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { VoteEventPayload } from './types';
import { onRedisMessage } from './redis';

const wss = new WebSocketServer({ noServer: true });
const pollClients = new Map<string, Set<WebSocket>>();
const allClients = new Set<WebSocket>();

// Heartbeat ping interval to keep connections alive and purge dead sockets
const HEARTBEAT_INTERVAL = 30000;
interface ExtWebSocket extends WebSocket {
  isAlive?: boolean;
}

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const extWs = ws as ExtWebSocket;
    if (extWs.isAlive === false) {
      return extWs.terminate();
    }
    extWs.isAlive = false;
    extWs.ping();
  });
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
  clearInterval(interval);
});

export function setupWebSocketHub(getPollData: (pollId: string) => any) {
  // Listen to Redis Pub/Sub cross-instance messages and broadcast to local connected WebSockets
  onRedisMessage((channel: string, message: string) => {
    const parts = channel.split(':');
    if (parts.length >= 3) {
      const pollId = parts[2];
      try {
        const parsed = JSON.parse(message);
        broadcastToPoll(pollId, parsed, false);
      } catch (e) {
        console.warn('[WS Parse Error on Redis Message]', e);
      }
    }
  });

  wss.on('connection', (ws: ExtWebSocket, _req: IncomingMessage, pollId: string) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    if (!pollClients.has(pollId)) {
      pollClients.set(pollId, new Set());
    }
    pollClients.get(pollId)!.add(ws);
    allClients.add(ws);

    // Send immediate snapshot of current poll state to client
    const poll = getPollData(pollId);
    if (poll) {
      const initPayload: VoteEventPayload = {
        type: 'init',
        poll_id: pollId,
        total_votes: poll.total_votes,
        options: poll.options,
        reactions: poll.reactions,
        timestamp: new Date().toISOString(),
        is_closed: poll.is_closed,
      };
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(initPayload));
      }
    }

    ws.on('close', () => {
      allClients.delete(ws);
      const clients = pollClients.get(pollId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) pollClients.delete(pollId);
      }
    });

    ws.on('error', () => {
      allClients.delete(ws);
      const clients = pollClients.get(pollId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) pollClients.delete(pollId);
      }
    });
  });
}

/**
 * Dispatches an event payload in real-time to every connected WebSocket client in a poll room.
 * Delivers truly zero-refresh live telemetry.
 */
export function broadcastToPoll(pollId: string, payload: VoteEventPayload | any, _publishRedis: boolean = true) {
  const clients = pollClients.get(pollId);
  if (!clients || clients.size === 0) return;

  const msg = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(msg);
      } catch (err) {
        console.warn('[WebSocket Send Error]', err);
      }
    }
  }
}

/**
 * Upgrades incoming HTTP connection to WebSocket if URL matches poll room pattern
 */
export function handleUpgrade(request: IncomingMessage, socket: Socket, head: Buffer) {
  const url = request.url || '';
  const match =
    url.match(/^\/api\/polls\/([a-zA-Z0-9_-]+)\/ws/) ||
    url.match(/^\/ws\?poll_id=([a-zA-Z0-9_-]+)/) ||
    url.match(/^\/ws\/([a-zA-Z0-9_-]+)/);

  if (match) {
    const pollId = match[1];
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, pollId);
    });
  } else {
    socket.destroy();
  }
}
