import { defineConfig } from 'prisma/config';

// Relative SQLite paths resolve from the backend/ folder.
export default defineConfig({
  schema: '../database/schema.prisma',
  migrations: { path: '../database/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? 'file:../data/dev.db' },
});
