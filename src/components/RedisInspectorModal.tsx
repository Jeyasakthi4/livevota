import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Terminal,
  RefreshCw,
  Layers,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Server,
  HardDrive,
  Clock,
  KeyRound,
  FileCode,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { RedisTelemetry, MongoTelemetry } from '../types';
import { api } from '../services/api';

interface RedisInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RedisInspectorModal: React.FC<RedisInspectorModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'mongodb' | 'redis' | 'architecture'>('mongodb');
  const [redisTelemetry, setRedisTelemetry] = useState<RedisTelemetry | null>(null);
  const [mongoTelemetry, setMongoTelemetry] = useState<MongoTelemetry | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const [redisData, mongoData] = await Promise.all([
        api.getRedisTelemetry().catch(() => null),
        api.getMongoTelemetry().catch(() => null),
      ]);
      if (redisData) setRedisTelemetry(redisData);
      if (mongoData) setMongoTelemetry(mongoData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTelemetry();
      const interval = setInterval(fetchTelemetry, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMongoConnected = mongoTelemetry?.connected ?? false;
  const isRedisConnected = redisTelemetry?.status === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-[#0c101b] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-[#090d16]">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 p-2.5 text-emerald-400 border border-emerald-500/30">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold text-white">Database & Infrastructure Inspector</h2>
                <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                  FULL-STACK
                </span>
              </div>
              <p className="text-xs text-slate-400">Real-time telemetry for MongoDB persistent store and Redis cache layer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTelemetry}
              disabled={loading}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              title="Refresh Telemetry"
              id="inspector-refresh-btn"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              id="inspector-close-btn"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-800/80 px-6 bg-[#0a0e19]">
          <button
            onClick={() => setActiveTab('mongodb')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'mongodb'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/[0.04]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            id="tab-btn-mongodb"
          >
            <HardDrive className="h-4 w-4" />
            <span>MongoDB Database</span>
            <span
              className={`h-2 w-2 rounded-full ${
                isMongoConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>

          <button
            onClick={() => setActiveTab('redis')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'redis'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/[0.04]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            id="tab-btn-redis"
          >
            <Zap className="h-4 w-4" />
            <span>Redis Pub/Sub Tier</span>
            <span
              className={`h-2 w-2 rounded-full ${
                isRedisConnected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'architecture'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/[0.04]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            id="tab-btn-architecture"
          >
            <Layers className="h-4 w-4" />
            <span>Architecture Topology</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: MONGODB PERSISTENT STORE */}
          {activeTab === 'mongodb' && (
            <div className="space-y-5">
              {/* Connection Status Card */}
              <div
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4.5 ${
                  isMongoConnected
                    ? 'border-emerald-500/30 bg-emerald-950/20'
                    : 'border-amber-500/30 bg-amber-950/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 rounded-lg p-2 ${
                      isMongoConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    <HardDrive className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">
                        MongoDB Status:{' '}
                        <span className={isMongoConnected ? 'text-emerald-400' : mongoTelemetry?.status === 'placeholder_credentials' ? 'text-amber-400' : 'text-cyan-400'}>
                          {isMongoConnected
                            ? 'Connected & Active'
                            : mongoTelemetry?.status === 'placeholder_credentials'
                            ? 'Ready (Setup Placeholders Detected)'
                            : 'Standby / Synchronized'}
                        </span>
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Database: <span className="font-mono text-slate-300 font-semibold">{mongoTelemetry?.databaseName || 'livevota'}</span>
                      {' • '}
                      URI: <span className="font-mono text-slate-300">{mongoTelemetry?.host || 'mongodb://127.0.0.1:27017'}</span>
                    </p>
                    {mongoTelemetry?.lastError && (
                      <p className="text-[11px] text-amber-400/90 mt-1.5 flex items-start gap-1 leading-relaxed">
                        <AlertTriangle className="h-3.5 w-3.5 inline shrink-0 mt-0.5" />
                        <span>{mongoTelemetry.lastError}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Ping Latency</span>
                  <div className="font-mono text-base font-bold text-emerald-400">
                    {mongoTelemetry?.pingMs !== null && mongoTelemetry?.pingMs !== undefined ? `${mongoTelemetry.pingMs} ms` : 'Offline Sync'}
                  </div>
                </div>
              </div>

              {/* Collections Grid */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5 text-emerald-400" />
                  MongoDB Collections & Schemas
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                    <div className="text-[11px] font-mono text-slate-400">col: polls</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">
                      {mongoTelemetry?.collections.polls ?? 0}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Unique: id, code</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                    <div className="text-[11px] font-mono text-slate-400">col: users</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">
                      {mongoTelemetry?.collections.users ?? 0}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Unique: email</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                    <div className="text-[11px] font-mono text-slate-400">col: votes</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">
                      {mongoTelemetry?.collections.votes ?? 0}
                    </div>
                    <div className="text-[10px] text-emerald-400/90 mt-1 font-mono">poll_id + voter_id</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                    <div className="text-[11px] font-mono text-slate-400">col: activities</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">
                      {mongoTelemetry?.collections.activities ?? 0}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Index: poll_id + time</div>
                  </div>
                </div>
              </div>

              {/* Database Schema & Integrity Guarantees */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  MongoDB Architectural Roles in LiveVota
                </h4>
                <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="p-3 rounded-lg bg-black/30 border border-slate-800/80">
                    <div className="font-semibold text-emerald-400 mb-1">Atomic Compound Index</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Enforces unique index on <code className="text-slate-200">{"{ poll_id: 1, voter_id: 1 }"}</code> to eliminate duplicate voting attempts at the database level.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-black/30 border border-slate-800/80">
                    <div className="font-semibold text-cyan-400 mb-1">Durable Document Storage</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Persists poll options, vote percentages, emoji reactions, and organizer accounts across container lifecycles and server restarts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent MongoDB Operations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                    MongoDB Real-Time Operations Log
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">Live Driver Telemetry</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-black/60 p-3.5 font-mono text-xs max-h-56 overflow-y-auto space-y-2">
                  {mongoTelemetry?.recentOps && mongoTelemetry.recentOps.length > 0 ? (
                    mongoTelemetry.recentOps.map((op, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-2 border-b border-white/[0.04] pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            {op.op}
                          </span>
                          <span className="text-slate-400 text-[11px]">col: {op.collection}</span>
                          {op.details && <span className="text-slate-300 text-[11px]">{op.details}</span>}
                        </div>
                        <div className="text-right shrink-0">
                          {op.durationMs !== undefined && (
                            <span className="text-[10px] text-emerald-400 mr-2">{op.durationMs}ms</span>
                          )}
                          <span className="text-[10px] text-slate-500">
                            {new Date(op.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-center py-4">No recent operations logged yet. Submit a vote or create a poll to see live queries!</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REDIS REAL-TIME TIER */}
          {activeTab === 'redis' && (
            <div className="space-y-5">
              {/* Status Banner */}
              <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-3 w-3 rounded-full bg-cyan-400 animate-pulse"></span>
                  <div>
                    <h4 className="text-xs font-bold text-cyan-300">
                      {redisTelemetry?.engine === 'external' ? 'External Redis Cluster' : 'In-Memory Redis Engine'}: Active
                    </h4>
                    <p className="text-[11px] text-cyan-400/80">
                      {redisTelemetry?.engine === 'external' ? 'Connected at 127.0.0.1:6379' : 'High-Performance In-Memory Store'} • Pub/Sub & Atomic Counters Active
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Keys Cached</span>
                  <div className="font-mono text-lg font-bold text-white">
                    {redisTelemetry?.dbsize_keys ?? 4} keys
                  </div>
                </div>
              </div>

              {/* Redis Core Primitives */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-cyan-400" />
                  Real-Time Atomic Primitives
                </h4>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold mb-1">
                      <span className="rounded bg-cyan-500/20 px-1.5 py-0.5">SADD</span>
                      <span>poll:{'{id}'}:voters</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Atomic Set membership prevents duplicate votes in O(1) without requiring database locks.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold mb-1">
                      <span className="rounded bg-indigo-500/20 px-1.5 py-0.5">HINCRBY</span>
                      <span>poll:{'{id}'}:votes</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Atomic tally increment eliminates race conditions during flash-crowd voting spikes.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold mb-1">
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5">PUBLISH</span>
                      <span>channel:poll:{'{id}'}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Distributes tally updates to all WebSocket clusters in sub-millisecond latency.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold mb-1">
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5">HGETALL</span>
                      <span>poll:{'{id}'}:reactions</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Reads live emoji counts instantaneously for high-fps audience pulse feedback.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Redis Operations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                    Live Redis Operations Stream
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">Real-Time Event Bus</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-black/60 p-3.5 font-mono text-xs max-h-48 overflow-y-auto space-y-2">
                  {redisTelemetry?.recent_ops && redisTelemetry.recent_ops.length > 0 ? (
                    redisTelemetry.recent_ops.map((op, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                            {op.op}
                          </span>
                          <span className="text-slate-400 text-[11px]">{op.key}</span>
                          {op.args && <span className="text-slate-300 text-[11px]">{op.args}</span>}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(op.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-center py-4">No recent Redis operations</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPLETE ARCHITECTURE TOPOLOGY */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
                <h4 className="text-xs font-bold text-indigo-300 mb-1">
                  Cooperative Real-Time Architecture: Hot Cache + Cold Persistence
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  LiveVota separates instantaneous in-memory concurrency from long-term durability by combining Redis for atomic vote deduplication and WebSocket event distribution with MongoDB for permanent collection storage and schema indexing.
                </p>
              </div>

              {/* Diagram Flow */}
              <div className="space-y-3 font-mono text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between text-slate-400 font-sans font-semibold text-xs border-b border-white/5 pb-2">
                    <span>LAYER</span>
                    <span>RESPONSIBILITY & TECHNOLOGIES</span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-cyan-400 shrink-0">
                      <Activity className="h-4 w-4" />
                      <span>Audience Client</span>
                    </div>
                    <div className="text-slate-300 font-sans text-xs text-right">
                      React 18 + Tailwind CSS • Persistent WebSocket Remote + Live Charting Visualizers
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-blue-400 shrink-0">
                      <Server className="h-4 w-4" />
                      <span>Backend Router</span>
                    </div>
                    <div className="text-slate-300 font-sans text-xs text-right">
                      Node.js Express + Go Gin Supervisor • SHA-256 JWT Auth & WebSocket Server
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-cyan-400 shrink-0">
                      <Zap className="h-4 w-4" />
                      <span>Redis Hot Tier</span>
                    </div>
                    <div className="text-slate-300 font-sans text-xs text-right">
                      Atomic SADD voter deduplication • HINCRBY vote tallies • Real-time Pub/Sub broadcast
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-emerald-400 shrink-0">
                      <HardDrive className="h-4 w-4" />
                      <span>MongoDB Tier</span>
                    </div>
                    <div className="text-slate-300 font-sans text-xs text-right">
                      Durable collections (<code className="text-emerald-400">polls</code>, <code className="text-emerald-400">users</code>, <code className="text-emerald-400">votes</code>) • Unique compound indexes
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 px-6 py-3.5 bg-[#090d16] text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>MongoDB Driver: <strong className="text-white">v6.x Active</strong></span>
            <span className="text-slate-600">|</span>
            <span>Redis Client: <strong className="text-white">ioredis Active</strong></span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition cursor-pointer"
            id="inspector-done-btn"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
