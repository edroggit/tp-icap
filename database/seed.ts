/** Inserts random trades on startup when the database is empty. */
import type { PrismaClient } from '../backend/src/generated/prisma/client.ts';

const PRICES: Record<string, number> = { AAPL: 227, MSFT: 534, TSLA: 341, NVDA: 181, AMZN: 228, JPM: 291, 'VOD.L': 0.74 };
const TRADERS = ['JSMITH', 'ABROWN', 'MJONES', 'KPATEL'];
const BOOKS = ['EQUITIES_UK', 'EQUITIES_US', 'TECH_GROWTH'];
const COUNTERPARTIES = ['Goldman Sachs', 'JP Morgan', 'Morgan Stanley', 'Barclays', 'UBS'];

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)]!;

export function generateTrade() {
  const symbol = pick(Object.keys(PRICES));
  return {
    symbol,
    side: pick(['BUY', 'SELL'] as const),
    quantity: (1 + Math.floor(Math.random() * 100)) * 100, // 100 to 10,000
    price: Math.round(PRICES[symbol]! * (0.95 + Math.random() * 0.1) * 100) / 100, // ±5%
    trader: pick(TRADERS),
    book: pick(BOOKS),
    counterparty: pick(COUNTERPARTIES),
    tradeTimestamp: new Date(Date.now() - Math.random() * 8 * 60 * 60_000), // within the last 8 hours
    status: Math.random() < 0.1 ? ('CANCELLED' as const) : ('ACTIVE' as const),
  };
}

export async function seedIfEmpty(prisma: PrismaClient, count = 500) {
  if ((await prisma.trade.count()) > 0) return;

  await prisma.$transaction(
    Array.from({ length: count }, () => {
      const trade = generateTrade();
      const snapshot = { ...trade, tradeTimestamp: trade.tradeTimestamp.toISOString() };
      return prisma.trade.create({ data: { ...trade, events: { create: { type: 'CREATED', changes: snapshot } } } });
    }),
  );
  console.log(`Seeded ${count} trades`);
}
