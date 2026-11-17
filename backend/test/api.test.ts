import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.ts';
import { createTestDb, validInput } from './helpers.ts';

let db: ReturnType<typeof createTestDb>;
let server: Server;
let base: string;
const onTradeChange = vi.fn();

beforeEach(async () => {
  db = createTestDb();
  onTradeChange.mockClear();
  server = createApp({ prisma: db.prisma, onTradeChange }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.cleanup();
});

const post = (path: string, body: unknown) =>
  fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe('trades API', () => {
  it('creates a trade, returns 201 and broadcasts it', async () => {
    const res = await post('/api/trades', validInput());

    expect(res.status).toBe(201);
    expect(onTradeChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'TRD-100001' }));
  });

  it('returns 400 with field errors for invalid input', async () => {
    const res = await post('/api/trades', { ...validInput(), quantity: -5 });

    expect(res.status).toBe(400);
    expect(((await res.json()) as { fieldErrors: object }).fieldErrors).toHaveProperty('quantity');
    expect(onTradeChange).not.toHaveBeenCalled();
  });
});
