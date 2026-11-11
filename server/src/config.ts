import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer, got "${raw}"`);
  }
  return value;
}

/** All runtime configuration, read once from the environment. */
export const config = {
  port: intFromEnv('PORT', 3000),
  dbPath: process.env.DB_PATH || path.resolve(here, '../../data/app.db'),
  historyLimit: intFromEnv('HISTORY_LIMIT', 100),
  clientDist: process.env.CLIENT_DIST || path.resolve(here, '../../client/dist'),
  heartbeatMs: intFromEnv('WS_HEARTBEAT_MS', 30_000),
} as const;
