import http from 'node:http';
import fs from 'node:fs';
import express from 'express';
import { config } from './config.ts';
import { openDatabase } from './database/db.ts';
import { createWebSocketServer } from './websocket/server.ts';

const db = openDatabase(config.dbPath);
console.log(`[db] opened ${config.dbPath}`);

const app = express();
app.disable('x-powered-by');

app.get('/health', (_req, res) => {
  const healthy = db.isHealthy();
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'error' });
});

if (fs.existsSync(config.clientDist)) {
  app.use(express.static(config.clientDist));
} else {
  console.warn(`[http] client build not found at ${config.clientDist}; serving API only`);
}

const server = http.createServer(app);
const wss = createWebSocketServer({
  server,
  db,
  historyLimit: config.historyLimit,
  heartbeatMs: config.heartbeatMs,
});

server.listen(config.port, () => {
  console.log(`[http] listening on http://0.0.0.0:${config.port}`);
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[app] ${signal} received, shutting down`);
  try {
    await wss.close();
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    db.close();
    console.log('[app] shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('[app] error during shutdown', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
