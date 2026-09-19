# PulsePoll Backend (Go + Gin + MongoDB + Redis)

PulsePoll is a modern real-time audience polling platform built for high concurrency, instant synchronization, and tamper-resistant live voting.

## 🏗 Architecture & Tech Stack

- **Framework**: [Go](https://go.dev) with [Gin Web Framework](https://gin-gonic.com/) (v1.9+)
- **Database**: [MongoDB](https://www.mongodb.com/) (Official Go Driver) for durable document persistence
- **Realtime Layer**: [Redis](https://redis.io/) (v7) for atomic operations, anti-cheat voter deduplication, and Pub/Sub broadcasting
- **WebSockets**: Real-time bidirectional streaming without page refresh
- **Authentication**: Stateless HMAC-SHA256 JWT tokens with role/claim extraction

```
[Audience / Host (React)]
        │
        ▼ (HTTP / WebSocket)
[Go Gin Server (:8080)]
   │                │
   │ (Atomic Ops)   │ (Pub/Sub)
   ▼                ▼
[Redis Server] ───► [Redis Channel: poll:{id}] ───► [WebSocket Clients (Live UI)]
   │
   ▼ (Async Write-Behind)
[MongoDB Database] (Durable Collection: polls, users)
```

---

## ⚡ Meaningful Redis Real-Time Role

Redis does not merely sit idle in the stack; it actively drives the low-latency core of the platform:

1. **Atomic Vote Counters (`HINCRBY`, `INCR`)**:
   - High-throughput audience voting never creates write contention or row locks in MongoDB.
   - Option vote counts are updated in memory in microseconds using Redis Hash `poll:{poll_id}:votes`.
2. **Voter Deduplication (`SADD`)**:
   - Each vote attempts `SADD poll:{poll_id}:voters {voter_id}`.
   - If Redis returns `0`, the voter has already voted and the submission is rejected with `409 Conflict` in O(1) time without querying the database.
3. **Event-Driven Pub/Sub (`PUBLISH`)**:
   - Whenever an atomic vote or poll status change occurs, the server publishes a `VoteEvent` to `channel:poll:{poll_id}`.
   - Distributed instances subscribe and instantly stream the delta to audience browsers without page refresh.
4. **Sub-millisecond Read Cache (`HGETALL`)**:
   - Live dashboard and audience results read from Redis Hash cache, decoupling presentation traffic from MongoDB.

---

## 🛡 Strict Input Validation

All incoming payloads are strictly validated using Gin's binding and `go-playground/validator/v10`:

- **Create Poll**:
  - `title`: Required, length between 5 and 200 characters.
  - `description`: Maximum 1000 characters.
  - `options`: Required array of 2 to 10 strings, each string non-empty and unique.
- **Vote Submission**:
  - `option_id`: Must match an active option ID.
  - `voter_id`: Required string (3-100 characters).
- **Authentication**:
  - `email`: Enforces RFC 5322 email formatting.
  - `password`: Enforces minimum length of 6 characters.

---

## 🔐 Authentication Requirements

Poll creation requires organizer authentication:
- Send `Authorization: Bearer <JWT_TOKEN>` on `POST /api/polls`.
- Audience voting (`POST /api/polls/:id/vote`) is accessible publicly with voter fingerprinting.

---

## 🚀 Running the Stack

### Option A: Docker Compose (Recommended)

```bash
docker-compose up --build
```
This boots Redis (:6379), MongoDB (:27017), and the Go Gin backend (:8080) in isolated, health-checked containers.

### Option B: Local Development

```bash
# 1. Start Redis & MongoDB
redis-server --daemonize yes
mongod --fork --logpath /var/log/mongodb.log

# 2. Run Go server
go run main.go
```
