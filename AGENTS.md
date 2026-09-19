# Agent Instructions & Project Mandates

## Core Principles

1. **Separation of Concerns**:
   - Keep frontend and backend code in their own folders.
   - Frontend belongs exclusively in `/src/` (React, components, UI utilities, styles).
   - Backend belongs exclusively in `/server/` (Express routes, Redis engine, MongoDB access, validation, auth, WebSockets).
   - Never mix frontend UI code and backend database/server code in the same file.
   - `server.ts` is strictly the server runtime entrypoint orchestrating modular components from `/server/`.

2. **Validate on the Backend**:
   - Never trust input straight from the client; validate and sanitize all inputs server-side before they touch the database or cache.
   - Rigorously check types, lengths, character sets, allowable ranges, and unique constraints.
   - Perform atomic deduplication checks (e.g. Redis sets and database queries) on the backend to enforce integrity.

3. **Truly Real-Time**:
   - If a user has to refresh the page to see a new vote, status change, or reaction, it does not count as real-time.
   - All live polling screens (Presenter Live Stage, Audience Voting View, 4K Presentation Mode) must maintain active WebSocket connections and update their visual state instantly upon receiving server broadcasts.
