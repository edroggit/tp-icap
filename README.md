# Realtime Chat — minimal WebSocket architecture

A small, complete real-time app: **React + Vite + Tailwind** in the browser, **Express + `ws`** on the server, **SQLite** for storage, all run by **Docker Compose**. It is meant to be a clean starting point you can build on, not a framework.

## Quick start

All you need is Docker Desktop (Windows/macOS) or Docker Engine with the Compose plugin (Linux). You don't need Node.js, npm or SQLite installed.

```bash
docker compose up --build
```

Open <http://localhost:3000> in two browser windows and send a message. It shows up in both at once, and it's still there after a refresh or a container rebuild.

```bash
docker compose down
```

`down` keeps your data. To delete the database too, run `docker compose down -v`.

## Architecture

There is one container running one Node.js process. Express serves the built React app, a health endpoint and the WebSocket endpoint, all on the same port. The browser always talks to the same origin, so there is no CORS, no extra proxy and no second container.

```
 Browser A ─┐                      ┌──────────── Docker container (node:24-alpine) ────────────┐
 Browser B ─┼── HTTP  GET /  ─────▶│  Express ── static client/dist (React build)             │
 Browser C ─┘── HTTP  GET /health ▶│          └─ /health  (checks DB)  ◀── Docker HEALTHCHECK  │
      ▲                            │                                                           │
      │   WebSocket  /ws  ◀───────▶│  ws server ──validate──▶ handleMessage ──▶ db.ts          │
      │                            │      │                                     │             │
      └──── broadcast chat:new ◀───┼──────┘                        node:sqlite  ▼             │
                                   │                               /app/data/app.db ──────────┼──▶ named volume
                                   └───────────────────────────────────────────────────────────┘     "app-data"
```

**Message flow**

1. The browser opens `ws://<host>/ws`. The server replies with `chat:history`, the latest N messages from SQLite.
2. The user submits a message. The client sends `{ type: "chat:send", author, text }`.
3. The server parses and validates the frame (`validate.ts`). An invalid frame gets an `error` reply sent to that client only.
4. The server inserts the row with a parameterised query and gets back the stored row.
5. The server broadcasts `{ type: "chat:new", message }` to every open socket.
6. Every client appends the message. After a refresh or reconnect, step 1 loads history again.

### Key decisions

| Decision | Why |
|---|---|
| Single container, single port | Express serves the UI and WebSockets together. This is the simplest topology and works the same on every OS. |
| `node:sqlite` (built into Node 24) | No native add-on to compile, no ORM, and no extra dependency. |
| Node runs `.ts` directly (type stripping) | The server needs no build step. `tsc` still typechecks it in strict mode during the Docker build. |
| `shared/protocol.ts` | One file of discriminated unions used by both client and server, so the protocol can't drift. |
| Named Docker volume for data | Survives `down`, `up --build` and container recreation. It avoids the file-locking and permission problems SQLite has with bind mounts on Windows and macOS. |
| History sent on connect | Refreshes and reconnects both resync the full state, with no extra REST endpoint. |

Runtime dependencies are `express` and `ws` on the server, and `react` and `react-dom` on the client.

## Project structure

```
.
├── shared/
│   ├── protocol.ts            # Message types (discriminated unions), limits, WS path
│   └── package.json           # Marks the folder as ESM
├── server/
│   ├── src/
│   │   ├── index.ts           # HTTP server, static files, /health, graceful shutdown
│   │   ├── config.ts          # All env-driven configuration
│   │   ├── database/db.ts     # SQLite init + parameterised queries
│   │   └── websocket/
│   │       ├── server.ts      # Connections, dispatch, broadcast, heartbeat, close
│   │       └── validate.ts    # Runtime validation of untrusted client frames
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── App.tsx            # Chat state + protocol handling
│   │   ├── main.tsx
│   │   ├── index.css          # Tailwind entry
│   │   ├── hooks/useWebSocket.ts   # Connection, typed send, reconnect w/ backoff
│   │   └── components/        # ConnectionStatus, MessageList, MessageForm
│   ├── index.html
│   ├── vite.config.ts         # Tailwind plugin + dev proxy for /ws
│   ├── package.json
│   └── tsconfig.json
├── Dockerfile                 # Multi-stage: client build → server typecheck → runtime
├── docker-compose.yml
├── .dockerignore
├── .env.example
└── README.md
```

## WebSocket protocol

Defined in [`shared/protocol.ts`](shared/protocol.ts):

```ts
type ClientMessage = { type: 'chat:send'; author: string; text: string };

type ServerMessage =
  | { type: 'chat:history'; messages: ChatMessage[] }
  | { type: 'chat:new'; message: ChatMessage }
  | { type: 'error'; error: string };
```

**How the connection is managed**

- **Client** (`useWebSocket.ts`): it shows the status as connecting, open or reconnecting. It reconnects with exponential backoff and full jitter (0.5 s doubling up to a 10 s cap), and reconnects straight away when the browser comes back `online`. On unmount it closes cleanly with code 1000. `send()` returns `false` when the socket isn't open, so the UI never drops a message silently.
- **Server** (`websocket/server.ts`): it rejects frames larger than 16 KB. It pings every 30 s and terminates peers that don't answer, which catches half-open TCP connections. A failure in one handler is reported to that client and doesn't crash the process. On `SIGTERM` or `SIGINT` it sends close code 1001 to every client, stops accepting connections, closes the HTTP server and then closes the database.

**Adding a message type**

1. Add a variant to `ClientMessage` or `ServerMessage`.
2. For a client message, add a `case` in `validate.ts` and in `handleMessage` (`server.ts`).
3. For a server message, add a `case` in `onMessage` (`App.tsx`).

The `never` checks in both switches cause compile errors until every place is handled.

## Database

The schema is created automatically at startup (`CREATE TABLE IF NOT EXISTS`) in `server/src/database/db.ts`:

```sql
messages(id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT, text TEXT, created_at TEXT)
```

The database runs in WAL mode with a busy timeout. Every query is a prepared statement with `?` parameters. To add tables, extend `SCHEMA` and add functions next to `insertMessage` and `getRecentMessages`. For schema *changes* to existing tables, add `ALTER TABLE` steps guarded by `PRAGMA user_version`.

To look at the data:

```bash
docker compose exec app node -e "const {DatabaseSync}=require('node:sqlite');console.table(new DatabaseSync(process.env.DB_PATH).prepare('SELECT * FROM messages').all())"
```

## Configuration

Copy `.env.example` to `.env` if you want to change anything. Compose reads `.env` automatically, and every value has a default.

| Variable | Default | Purpose |
|---|---|---|
| `HOST_PORT` | `3000` | Port on your machine |
| `PORT` | `3000` | Port inside the container |
| `HISTORY_LIMIT` | `100` | Messages sent on connect |
| `WS_HEARTBEAT_MS` | `30000` | Ping interval for dead-connection detection |
| `DB_PATH` | `/app/data/app.db` | Set by Compose and the Dockerfile; points into the volume |

## Optional: developing without Docker

This needs Node.js 24 or later. Run each command in its own terminal:

```bash
cd server && npm install && npm run dev
```

```bash
cd client && npm install && npm run dev
```

Open <http://localhost:5173>. Vite proxies `/ws` and `/health` to `:3000`, the server reloads on save via `node --watch`, and the UI uses hot module replacement. Locally the database is stored in `./data/app.db`.

`npm run typecheck` works in both folders.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `port is already allocated` / `address already in use` | Set `HOST_PORT=3001` in `.env` (or stop whatever uses 3000), then `docker compose up`. |
| `Cannot connect to the Docker daemon` | Start Docker Desktop, or run `sudo systemctl start docker` on Linux. |
| Status stays "Reconnecting…" | Check `docker compose ps` (should be `healthy`) and `docker compose logs app`. If you're behind a reverse proxy, it must forward `Upgrade`/`Connection` headers for `/ws`. |
| Old UI after code changes | Rebuild: `docker compose up --build`. A hard refresh in the browser may also be needed. |
| Want a clean database | `docker compose down -v`, then `docker compose up --build`. |
| `npm ci` fails during build | The lockfiles are out of sync with `package.json`. Run `npm install` in that folder (or in a `node:24` container) and commit the lockfile. |
| Windows: odd script/line-ending errors | `.gitattributes` forces LF. Re-clone, or run `git add --renormalize .` |
| `ExperimentalWarning` lines | `node:sqlite` is still flagged experimental. The warning is suppressed with `--disable-warning=ExperimentalWarning`. |
