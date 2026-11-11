import type { Server } from 'node:http';
import { WebSocketServer, WebSocket, type RawData } from 'ws';
import { WS_PATH, type ClientMessage, type ServerMessage } from '../../../shared/protocol.ts';
import type { Database } from '../database/db.ts';
import { parseClientMessage } from './validate.ts';

interface Options {
  server: Server;
  db: Database;
  historyLimit: number;
  heartbeatMs: number;
}

export function createWebSocketServer({ server, db, historyLimit, heartbeatMs }: Options) {
  const wss = new WebSocketServer({ server, path: WS_PATH, maxPayload: 16 * 1024 });
  const alive = new WeakMap<WebSocket, boolean>();

  const send = (ws: WebSocket, msg: ServerMessage) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  };

  const broadcast = (msg: ServerMessage) => {
    const payload = JSON.stringify(msg);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    }
  };

  const handleMessage = (ws: WebSocket, msg: ClientMessage) => {
    switch (msg.type) {
      case 'chat:send': {
        const saved = db.insertMessage(msg.author, msg.text);
        broadcast({ type: 'chat:new', message: saved });
        return;
      }
      default: {
        const unhandled: never = msg.type;
        throw new Error(`Unhandled message type: ${String(unhandled)}`);
      }
    }
  };

  wss.on('connection', (ws, req) => {
    const peer = req.socket.remoteAddress ?? 'unknown';
    console.log(`[ws] connected ${peer} (clients: ${wss.clients.size})`);
    alive.set(ws, true);

    ws.on('pong', () => alive.set(ws, true));

    ws.on('message', (data: RawData, isBinary: boolean) => {
      if (isBinary) return send(ws, { type: 'error', error: 'Binary frames are not supported' });

      const parsed = parseClientMessage(data.toString());
      if (!parsed.ok) return send(ws, { type: 'error', error: parsed.error });

      try {
        handleMessage(ws, parsed.message);
      } catch (err) {
        console.error('[ws] failed to handle message', err);
        send(ws, { type: 'error', error: 'Server error, message not saved' });
      }
    });

    ws.on('error', (err) => console.error(`[ws] socket error ${peer}`, err.message));
    ws.on('close', (code) => console.log(`[ws] disconnected ${peer} code=${code} (clients: ${wss.clients.size})`));

    // Initial state: recent history from SQLite.
    try {
      send(ws, { type: 'chat:history', messages: db.getRecentMessages(historyLimit) });
    } catch (err) {
      console.error('[ws] failed to load history', err);
      send(ws, { type: 'error', error: 'Could not load message history' });
    }
  });

  // Heartbeat: terminate connections that stopped answering pings (e.g. dropped networks).
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!alive.get(ws)) {
        ws.terminate();
        continue;
      }
      alive.set(ws, false);
      ws.ping();
    }
  }, heartbeatMs);

  wss.on('close', () => clearInterval(heartbeat));

  /** Close every client with "going away" and stop accepting connections. */
  const close = () =>
    new Promise<void>((resolve) => {
      clearInterval(heartbeat);
      for (const ws of wss.clients) ws.close(1001, 'Server shutting down');
      // Force-kill anything that hasn't completed the close handshake.
      const force = setTimeout(() => wss.clients.forEach((ws) => ws.terminate()), 2000);
      wss.close(() => {
        clearTimeout(force);
        resolve();
      });
    });

  return { close };
}
