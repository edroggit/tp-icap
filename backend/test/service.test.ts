import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTradeService, type TradeService } from '../src/trades/service.ts';
import { createTestDb, validInput } from './helpers.ts';

let db: ReturnType<typeof createTestDb>;
let trades: TradeService;

beforeEach(() => {
  db = createTestDb();
  trades = createTradeService(db.prisma);
});
afterEach(() => db.cleanup());

describe('trade service', () => {
  it('creates an active trade with a CREATED audit event', async () => {
    const trade = await trades.create(validInput());

    expect(trade).toEqual({ ...validInput(), id: 'TRD-100001', status: 'ACTIVE' });
    expect((await trades.history(trade.id)).map((e) => e.type)).toEqual(['CREATED']);
  });

  it('amends a trade and records what changed', async () => {
    const trade = await trades.create(validInput());
    const amended = await trades.amend(trade.id, validInput({ quantity: 6000 }));

    expect(amended.quantity).toBe(6000);
    expect((await trades.history(trade.id))[1]).toMatchObject({
      type: 'AMENDED',
      changes: { quantity: { from: 5000, to: 6000 } },
    });
  });

  it('cancels a trade, then rejects amending or cancelling it again', async () => {
    const trade = await trades.create(validInput());

    expect((await trades.cancel(trade.id)).status).toBe('CANCELLED');
    await expect(trades.amend(trade.id, validInput())).rejects.toMatchObject({ status: 409 });
    await expect(trades.cancel(trade.id)).rejects.toMatchObject({ status: 409 });
  });

  it('returns 404 for an unknown trade', async () => {
    await expect(trades.cancel('TRD-999999')).rejects.toMatchObject({ status: 404 });
  });
});
