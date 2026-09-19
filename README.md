# LiveVota — Real-Time Polling & Interactive Event Atmosphere Platform

<div align="center">

**Sub-millisecond live polling, audience telemetry, and immersive event atmospheres powered by WebSockets, Redis 7 Pub/Sub, MongoDB, and Google Gemini AI.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express)](https://expressjs.com)
[![Redis](https://img.shields.io/badge/Redis-7.0%20Pub%2FSub-DC382D?style=flat-square&logo=redis)](https://redis.io)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.6-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com)
[![Google Gemini API](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev)

</div>

---

## 📑 Table of Contents

1. [System Architecture Diagrams](#-system-architecture-diagrams)
   - [High-Level Topology](#1-high-level-topology)
   - [Real-Time Hot-Path Sequence](#2-real-time-hot-path-sequence-vote--broadcast)
   - [Event Atmosphere Pipeline](#3-event-atmosphere-pipeline)
2. [Key Architectural & Engineering Decisions](#-key-architectural--engineering-decisions)
3. [How to Run LiveVota](#-how-to-run-livevota)
   - [Prerequisites](#prerequisites)
   - [Step-by-Step Quickstart](#step-by-step-quickstart)
   - [Production Build & Container Deployment](#production-build--container-deployment)
4. [Environment Variables Reference](#-environment-variables-reference)
5. [Core Feature Breakdown](#-core-feature-breakdown)
6. [Project Structure](#-project-structure)

---

## 🏛 System Architecture Diagrams

### 1. High-Level Topology

LiveVota separates **stateless web delivery**, **ultra-low-latency in-memory synchronization**, **durable document persistence**, and **server-side AI reasoning**:

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|                                                                                   |
|  +---------------------------+  +--------------------------+  +----------------+  |
|  |     Audience Mobile       |  |    Presenter Big-Screen  |  | Creator Admin  |  |
|  | (QR Scan / Instant Vote)  |  |  (Atmospheric Stage 4K)  |  |   Dashboard    |  |
|  +-------------+-------------+  +------------+-------------+  +-------+--------+  |
+----------------|-----------------------------|------------------------|-----------+
                 | HTTP REST & Static Assets   | WebSocket (ws://)      |
                 v                             v                        v
+-----------------------------------------------------------------------------------+
|                         NODE.JS / EXPRESS HYBRID BACKEND                          |
|                                                                                   |
|  [Nginx Reverse Proxy / Port 3000 Ingress]                                        |
|         |                                                                         |
|         +---> Express REST API Layer (/api/*)                                     |
|         |        ├── /api/polls, /api/vote, /api/auth                             |
|         |        └── /api/ai/generate (Gemini 2.5 Flash Proxy)                    |
|         |                                                                         |
|         +---> WebSocket Server (ws:// /ws/polls)                                  |
|         |        ├── Channel Multiplexer & Room Heartbeats                        |
|         |        └── Instant Reaction & Voting Fanout (<50ms)                     |
|         |                                                                         |
|         +---> Vite Server Middleware (Dev) / Static SPA Fallback (Prod)           |
+-----------------------------------------------------------------------------------+
       |                           |                                 |
       v                           v                                 v
+------------------+     +-------------------+            +---------------------+
|  REDIS 7 ENGINE  |     |  MONGODB CLUSTER  |            |  GOOGLE GEMINI API  |
| (Hot-Path Cache) |     | (Durable Records) |            |   (Server-Side)     |
|                  |     |                   |            |                     |
| • Atomic HINCRBY |     | • Poll Documents  |            | • Topic Ideation    |
| • Room Presence  |     | • Historical Logs |            | • Distractor Gen    |
| • Pub/Sub Bus    |     | • User Auth State |            | • Realtime Insights |
| • Live Reactions |     | • Event Metas     |            +---------------------+
+------------------+     +-------------------+
```

---

### 2. Real-Time Hot-Path Sequence (Vote → Broadcast)

```
Audience Client             Express / WS Server             Redis Engine           MongoDB Cluster
      |                              |                           |                        |
      | 1. POST /api/vote (Option ID)|                           |                        |
      |----------------------------->|                           |                        |
      |                              | 2. HINCRBY poll:votes     |                        |
      |                              |-------------------------->|                        |
      |                              | 3. Sub-ms New Counts      |                        |
      |                              |<--------------------------|                        |
      | 4. HTTP 200 OK (Voted)       |                           |                        |
      |<-----------------------------| 5. PUBLISH channel:poll   |                        |
      |                              |-------------------------->|                        |
      |                              |                           |                        |
      |                              | 6. Redis PubSub Trigger   |                        |
      |                              |<--------------------------|                        |
      | 7. WS Broadcast (Updated Aggregates)                     |                        |
      |<=============================|                           |                        |
      |                              |                                                    |
      |                              | 8. Async Write-Behind Batch                        |
      |                              |--------------------------------------------------->|
      |                              | 9. Durable ACK                                     |
      |                              |<---------------------------------------------------|
```

---

### 3. Event Atmosphere Pipeline

Each event template binds an **atmospheric personality**, driving visual geometry, audio feedback, and stage presence across all audience and presenter devices:

```
[Event Archetype Selected] (e.g., Quiz Arena / Championship / Brainstorm)
          │
          ├──> 1. Visual Shader / Canvas Geometry (Perspective Grid, Speed Streaks, Aurora Wash)
          ├──> 2. Web Audio Synthesizer Node (Countdown Chimes, Victory Triad, Ambient Drone)
          ├──> 3. Realtime Telemetry Styling (Buzzer Rings, Leaderboard Podiums, Cluster Clouds)
          └──> 4. Persistent Room State (Synchronized to Audience & Big-Screen Presentation Mode)
```

---

## 💡 Key Architectural & Engineering Decisions

### 1. Dual-Storage Engine: Redis for Hot-Paths, MongoDB for Durability
* **Problem**: Real-time polling with hundreds of concurrent audience votes creates severe write contention and lock bottlenecks on relational or traditional document databases.
* **Solution**: High-performance dual-storage pattern:
  * **Redis (In-Memory)**: Handles hot writes using atomic `HINCRBY` operations, active connection presence, and high-throughput Redis Pub/Sub channels (`channel:poll:*`).
  * **MongoDB (Persistent Documents)**: Captures structured poll schema, question options, user authentication, and historical session logs via asynchronous write-behind updates.

### 2. Resilient Zero-Configuration In-Memory Fallback
* **Decision**: While production workloads connect to real Redis clusters (`REDIS_URL`) and MongoDB replica sets (`MONGODB_URI`), the application includes a **transparent in-memory fallback engine** (`ioredis-mock` and embedded document memory store).
* **Impact**: Developers can clone, run `npm run dev`, and immediately experience full real-time voting, Pub/Sub broadcasting, and live analytics **without requiring local Docker containers or external cloud databases**. If external credentials are provided, it automatically switches to live clusters.

### 3. Server-Side Google Gemini API Proxy (`@google/genai`)
* **Decision**: Never expose API keys or execute model inferences client-side.
* **Implementation**: All Gemini API calls route through `/api/ai/*` server endpoints using the official `@google/genai` TypeScript SDK.
* **Capabilities**: Generates context-aware polls with smart distractors, balances option parity, and summarizes real-time audience sentiments using `gemini-2.5-flash`.

### 4. WebSocket Multiplexing with Realtime Reconnection
* **Decision**: Single persistent WebSocket connection per client that handles live poll status changes, vote increment tallies, presenter stage controls, and floating audience reactions (emojis).
* **Reliability**: Incorporates client-side exponential backoff reconnection, heartbeat ping/pong keepalives, and automatic room re-subscription.

### 5. Signature Event Atmospheres with Zero Configuration
* **Decision**: Instead of plain generic tables or charts, LiveVota ships **6 distinct signature atmospheres**:
  * **Quiz & Speed Trivia Arena**: Countdown spotlights, game-show buzzer timers, and diamond grid geometry.
  * **Championship Arena**: Stadium floodlights, high-contrast carbon streaks, and live 3-tier leaderboard podiums.
  * **Studio Brainstorm**: Constellation node graph, floating idea cards, and aurora lavender washes.
  * **Gala & Social Celebration**: Velvet midnight backdrop, drifting champagne confetti, and milestone telemetry.
  * **Empirical Research Survey**: Cartesian analytical grids, real-time oscilloscope waveform vectors, and confidence metrics.
  * **Keynote Conference Stage**: 3D convergent stage perspective lines and volumetric auditorium lighting.

### 6. Hardware-Accelerated Smooth Navigation & Micro-Interactions
* **Decision**: Fluid UX with native `scroll-behavior: smooth`, offset mitigation for sticky navigation bars, responsive horizontal carousels with smooth chevron stepping, dynamic scroll progress gauges, and a floating back-to-top control.

---

## 🚀 How to Run LiveVota

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- *(Optional)* Live **Redis** instance & **MongoDB** cluster (the app runs out-of-the-box in resilient in-memory mode if omitted)
- *(Optional)* **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

---

### Step-by-Step Quickstart

#### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone <your-repository-url>
cd livevota

# Install all npm dependencies
npm install
```

#### 2. Configure Environment Variables
Copy the sample environment file:
```bash
cp .env.example .env.local
```

Open `.env.local` and configure your keys:
```env
# Optional: Set your Google Gemini API Key for AI Poll Generation
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Connect to a live MongoDB instance (defaults to in-memory store if unset)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=livevota

# Optional: Connect to external Redis (defaults to in-memory mock if unset)
REDIS_URL=redis://localhost:6379

# Application Port (standard is 3000)
PORT=3000
```

#### 3. Run the Development Server
```bash
npm run dev
```
The server will start up on **http://localhost:3000**.
- The Express backend serves the REST API and WebSocket hub on port `3000`.
- Vite dev server runs as integrated middleware, providing instantaneous Hot Module Replacement.

---

### Production Build & Container Deployment

To compile and package LiveVota for production deployment (Cloud Run, Docker, or standalone Node.js):

#### 1. Compile Client & Server Bundles
```bash
npm run build
```
This executes:
1. `vite build` — Optimizes and bundles React client assets into `/dist`.
2. `esbuild server.ts` — Bundles the TypeScript backend into a single CommonJS executable at `/dist/server.cjs`.

#### 2. Start the Production Server
```bash
npm start
```
Starts the production server from `dist/server.cjs` listening on `0.0.0.0:3000`.

#### 3. Verification & Type Checking
```bash
npm run lint
```
Runs TypeScript compiler checks (`tsc --noEmit`) to ensure clean type safety.

---

## 🔧 Environment Variables Reference

| Variable | Description | Required? | Default Fallback |
| :--- | :--- | :---: | :--- |
| `GEMINI_API_KEY` | Google Gemini API secret for AI poll creation and analytics | Optional | AI feature gracefully prompts for key if missing |
| `MONGODB_URI` | Connection URI for persistent MongoDB cluster | Optional | Built-in resilient in-memory document store |
| `MONGODB_DB_NAME` | Target database name inside MongoDB | Optional | `livevota` |
| `REDIS_URL` | Full connection URL (e.g. `redis://user:pass@host:6379`) | Optional | Built-in in-memory Redis engine (`ioredis-mock`) |
| `REDIS_HOST` | Redis host (alternative to `REDIS_URL`) | Optional | `localhost` |
| `REDIS_PORT` | Redis port | Optional | `6379` |
| `APP_URL` | Canonical public URL of the application for QR codes | Optional | Derived from request host |

---

## ✨ Core Feature Breakdown

1. **Audience Live Voting View**:
   - Clean mobile-first interface optimized for sub-second touches.
   - Live participation statistics, animated option percentages, and celebratory confetti.
   - Built-in live camera QR scanner (`jsqr`) for one-tap auditorium onboarding.

2. **Presenter Big-Screen & 4K Stage Mode**:
   - Fullscreen-optimized display designed for projectors and large auditorium screens.
   - Real-time animated vote bars with motion layout transitions.
   - Dynamic stage atmosphere themes that match the event's archetype.

3. **AI Poll Architect (Google Gemini)**:
   - Generate creative, engaging, and balanced multi-option polls in seconds.
   - Auto-suggests plausible distractors and balances question complexity.

4. **Redis Telemetry & Inspector Modal**:
   - Real-time transparency dashboard displaying atomic key counters (`HINCRBY`), Pub/Sub channel subscribers, and memory usage.

5. **Creator Analytics & Session Management**:
   - Track total votes, peak participation velocity, and session duration.
   - Live controls to pause, lock, or reset rooms on the fly.

---

## 📁 Project Structure

```
.
├── src/
│   ├── components/            # React UI components
│   │   ├── templates/         # Event personality visual atmosphere previews
│   │   ├── AudienceVoteView.tsx       # Live audience voting screen
│   │   ├── LiveResultsView.tsx        # Presenter live results dashboard
│   │   ├── PresentationModeView.tsx   # 4K auditorium stage mode
│   │   ├── CreatePollModal.tsx        # Poll builder with AI generator
│   │   ├── EventTemplatesSection.tsx  # Atmospheric templates showcase
│   │   ├── RedisInspectorModal.tsx    # Live Redis metrics inspector
│   │   └── ThemedEventBackground.tsx  # Dynamic atmospheric shaders & geometry
│   ├── data/                  # Event templates and preset themes
│   ├── services/              # Client API and WebSocket client
│   ├── utils/                 # Audio synthesizer, smooth scroll, and theme manager
│   ├── types.ts               # Global TypeScript models and interfaces
│   ├── App.tsx                # Primary application controller and routing
│   └── main.tsx               # Client entry point
├── server.ts                  # Express backend, WebSocket server, and API routes
├── server/
│   └── db.ts                  # Dual-persistence layer (MongoDB + in-memory store)
├── package.json               # Scripts and dependencies
└── vite.config.ts             # Vite configuration with Tailwind CSS plugin
```

---

<div align="center">
Built with craftsmanship for live audiences, keynotes, classrooms, and creators worldwide.
</div>
