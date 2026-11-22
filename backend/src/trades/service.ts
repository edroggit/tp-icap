import type { PrismaClient } from '../db.ts';
import type { Trade as TradeRow, TradeEvent as TradeEventRow } from '../generated/prisma/client.ts';
import type { Trade, TradeEvent, TradeInput } from '../../../shared/trade.ts';
import { HttpError } from '../errors.ts';

// Database id 1 is shown as "TRD-100001".
const ID_OFFSET = 100_000;
const formatTradeId = (id: number) => `TRD-${ID_OFFSET + id}`;
const parseTradeId = (tradeId: string) => Number(tradeId.replace(/^TRD-/, '')) - ID_OFFSET;

const toApiTrade = (row: TradeRow): Trade => ({
  id: formatTradeId(row.id),
  symbol: row.symbol,
  side: row.side,
  quantity: row.quantity,
  price: row.price,
  trader: row.trader,
  book: row.book,
  counterparty: row.counterparty,
  tradeTimestamp: row.tradeTimestamp.toISOString(),
  status: row.status,
});

const toApiEvent = (row: TradeEventRow): TradeEvent => ({
  id: row.id,
  type: row.type,
  changes: row.changes as Record<string, unknown>,
  createdAt: row.createdAt.toISOString(),
});

const FIELDS = ['symbol', 'side', 'quantity', 'price', 'trader', 'book', 'counterparty', 'tradeTimestamp'] as const;

/** Which fields an amendment changes, as `{ field: { from, to } }` for the audit trail. */
function diff(current: Trade, next: TradeInput) {
  const changes: Record<string, { from: string | number; to: string | number }> = {};
  for (const field of FIELDS) {
    if (current[field] !== next[field]) changes[field] = { from: current[field], to: next[field] };
  }
  return changes;
}

/** Trade reads and writes. Every write also records an audit event. */
export function createTradeService(prisma: PrismaClient) {
  async function findTrade(tradeId: string): Promise<TradeRow> {
    const id = parseTradeId(tradeId);
    const row = Number.isInteger(id) && id > 0 ? await prisma.trade.findUnique({ where: { id } }) : null;
    if (!row) throw new HttpError(404, `Trade ${tradeId} not found`);
    return row;
  }

  return {
    async list(): Promise<Trade[]> {
      const rows = await prisma.trade.findMany({ orderBy: { tradeTimestamp: 'desc' } });
      return rows.map(toApiTrade);
    },

    async history(tradeId: string): Promise<TradeEvent[]> {
      const row = await findTrade(tradeId);
      const events = await prisma.tradeEvent.findMany({ where: { tradeId: row.id }, orderBy: { id: 'asc' } });
      return events.map(toApiEvent);
    },

    async create(input: TradeInput): Promise<Trade> {
      const row = await prisma.trade.create({
        data: {
          ...input,
          tradeTimestamp: new Date(input.tradeTimestamp),
          events: { create: { type: 'CREATED', changes: { ...input } } },
        },
      });
      return toApiTrade(row);
    },

    async amend(tradeId: string, input: TradeInput): Promise<Trade> {
      const row = await findTrade(tradeId);
      if (row.status === 'CANCELLED') throw new HttpError(409, `Trade ${tradeId} is cancelled and can't be amended`);

      const updated = await prisma.trade.update({
        where: { id: row.id },
        data: {
          ...input,
          tradeTimestamp: new Date(input.tradeTimestamp),
          events: { create: { type: 'AMENDED', changes: diff(toApiTrade(row), input) } },
        },
      });
      return toApiTrade(updated);
    },

    async cancel(tradeId: string): Promise<Trade> {
      const row = await findTrade(tradeId);
      if (row.status === 'CANCELLED') throw new HttpError(409, `Trade ${tradeId} is already cancelled`);

      const updated = await prisma.trade.update({
        where: { id: row.id },
        data: {
          status: 'CANCELLED',
          events: { create: { type: 'CANCELLED', changes: { status: { from: 'ACTIVE', to: 'CANCELLED' } } } },
        },
      });
      return toApiTrade(updated);
    },
  };
}

export type TradeService = ReturnType<typeof createTradeService>;
