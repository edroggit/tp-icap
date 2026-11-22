# Trade Blotter

A real-time blotter for equity trades. You can view, sort and filter trades, and book, amend and cancel them. Changes appear in every open browser straight away.

**Stack:** React + TypeScript + Vite + Tailwind · Express + TypeScript · Prisma + SQLite · WebSockets (`ws`) · Docker Compose · Vitest

## Running it

You need Docker Desktop (or Docker Engine with Compose).

```bash
docker compose up --build
```

Open <http://localhost:3000>. On first start the database is created and seeded with 500 random trades. Open a second browser window to see live updates.

```bash
docker compose down       # stop (data is kept)
docker compose down -v    # stop and delete the database
```

### Without Docker (Node.js 24+)

Run each in its own terminal:

```bash
cd backend && npm install && npx prisma generate && npx prisma migrate deploy && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

Then open <http://localhost:5173>. Vite forwards `/api` and `/ws` to the backend on port 3000.

## Tests

```bash
cd backend && npm test
```

```bash
cd frontend && npm test
```

- **Backend:** validation rules; the trade service (create, amend, cancel and the audit events each one writes); and the HTTP API (201 on create plus a broadcast; 400 with field errors). The service and API tests run against a fresh temporary SQLite database built from the real migrations.
- **Frontend:** sorting and filtering.

## Architecture

```
React ── REST (/api/trades) ──▶ Express ── Prisma ──▶ SQLite (Docker volume)
  ▲                               │
  └──── WebSocket (/ws) ◀─────────┘  broadcast after every create / amend / cancel
```

- **REST for reads and writes, WebSocket only for pushing changes.** Writes get normal HTTP status codes (400, 404, 409), and "refresh" is just a GET. After every write the server broadcasts the updated trade, and each browser replaces that row.
- **Validation is shared.** `shared/trade.ts` holds the trade types and `validateTradeInput`. The form uses it for instant feedback and the API uses it as the real check.
- **Audit trail (bonus).** Every create, amend and cancel writes a `TradeEvent` row recording what changed. Each table row has a History button that shows it. This is the schema's one relation: a trade has many events.
- **One container.** Express serves the built React app, the API and the WebSocket on port 3000. Migrations run when the container starts, and seeding runs when the database is empty.
- **No UI or state libraries.** The UI is a plain table, the native `<dialog>` element and React state.

```
frontend/src/   App.tsx, api.ts, hooks/ (useTrades, useWebSocket), lib/blotter.ts (sort/filter), components/
backend/src/    index.ts (startup + WebSocket broadcast), app.ts (Express), trades/ (service + routes), errors.ts
database/       schema.prisma, migrations/, seed.ts
shared/         trade.ts (types, validation and the WebSocket message type)
```

### API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/trades` | All trades, newest first |
| POST | `/api/trades` | Create; 400 with `fieldErrors` if the input is invalid |
| PUT | `/api/trades/:id` | Amend; 409 if the trade is cancelled |
| POST | `/api/trades/:id/cancel` | Cancel; 409 if the trade is already cancelled |
| GET | `/api/trades/:id/history` | Audit events for the trade |

## Assumptions

- There's no login. "Trader" is a field on the trade, not the current user.
- `tradeTimestamp` (date and time) stands in for the brief's `tradeDate`.
- Cancelling is final. There's no un-cancel and no delete.
- Prices are in the instrument's own currency; there's no currency field.

## Trade-offs

- **Price is a float.** A real system would use a decimal type or integer pence/cents.
- **Sorting and filtering happen in the browser, with no pagination.** That's fine for hundreds or low thousands of trades. Beyond that, move it into the API.
- **Last write wins.** If two people amend the same trade at the same time, the later save overwrites the earlier one. A version number on each trade would detect this.
- **Updates missed while offline aren't replayed.** If the WebSocket drops, it reconnects after 2 seconds, but any changes made in the meantime only appear after pressing Refresh.
- **SQLite only allows one writer at a time.** That's fine for a single container. Running several servers would need Postgres and a shared channel for broadcasts.
- **No browser end-to-end tests.** The live flow was checked by hand.
