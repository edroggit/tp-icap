import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client.ts';

export type { PrismaClient };

/** Create a Prisma client for a SQLite file URL such as `file:../data/dev.db`. */
export function createPrismaClient(url: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}
