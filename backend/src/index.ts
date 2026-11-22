import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';
import { seedIfEmpty } from '../../database/seed.ts';
import type { ServerMessage } from '../../shared/trade.ts';
import { createApp } from './app.ts';
import { createPrismaClient } from './db.ts';

const port = Number(process.env.PORT) || 3000;
const prisma = createPrismaClient(process.env.DATABASE_URL || 'file:../data/dev.db');
await seedIfEmpty(prisma);

const server = http.createServer();
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(message: ServerMessage) {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

const app = createApp({
  prisma,
  onTradeChange: (trade) => broadcast({ type: 'trade:upserted', trade }),
  frontendDist: fileURLToPath(new URL('../../frontend/dist', import.meta.url)),
});
server.on('request', app);
server.listen(port, () => console.log(`Listening on http://localhost:${port}`));

// Node ignores SIGTERM when it runs as PID 1 in Docker, so exit explicitly.
process.on('SIGTERM', () => process.exit(0));
