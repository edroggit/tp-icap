import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { createPrismaClient, type PrismaClient } from '../src/db.ts';
import type { TradeInput } from '../../shared/trade.ts';

const migrationsDir = fileURLToPath(new URL('../../database/migrations/', import.meta.url));

/** A fresh SQLite database in a temp folder, built from the real migrations. */
export function createTestDb(): { prisma: PrismaClient; cleanup: () => Promise<void> } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blotter-test-'));
  const file = path.join(dir, 'test.db');

  const sqlite = new DatabaseSync(file);
  for (const name of fs.readdirSync(migrationsDir).sort()) {
    const sql = path.join(migrationsDir, name, 'migration.sql');
    if (fs.existsSync(sql)) sqlite.exec(fs.readFileSync(sql, 'utf8'));
  }
  sqlite.close();

  const prisma = createPrismaClient(`file:${file}`);
  return {
    prisma,
    cleanup: async () => {
      await prisma.$disconnect();
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

export const validInput = (overrides: Partial<TradeInput> = {}): TradeInput => ({
  symbol: 'AAPL',
  side: 'BUY',
  quantity: 5000,
  price: 227.45,
  trader: 'JSMITH',
  book: 'EQUITIES_US',
  counterparty: 'Goldman Sachs',
  tradeTimestamp: '2026-08-18T09:15:23.000Z',
  ...overrides,
});
