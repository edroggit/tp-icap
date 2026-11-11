import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { ChatMessage } from '../../../shared/protocol.ts';

/**
 * Thin data-access module around Node's built-in SQLite driver (node:sqlite).
 * All SQL lives here and every query is parameterised.
 */

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    author     TEXT    NOT NULL,
    text       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
`;

interface MessageRow {
  id: number;
  author: string;
  text: string;
  created_at: string;
}

const toChatMessage = (row: MessageRow): ChatMessage => ({
  id: row.id,
  author: row.author,
  text: row.text,
  createdAt: row.created_at,
});

export type Database = ReturnType<typeof openDatabase>;

export function openDatabase(dbPath: string) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(SCHEMA);

  const insertStmt = db.prepare(
    'INSERT INTO messages (author, text) VALUES (?, ?) RETURNING id, author, text, created_at',
  );
  // Newest N messages, returned oldest-first for display.
  const recentStmt = db.prepare(
    'SELECT * FROM (SELECT id, author, text, created_at FROM messages ORDER BY id DESC LIMIT ?) ORDER BY id ASC',
  );
  const pingStmt = db.prepare('SELECT 1 AS ok');

  return {
    insertMessage(author: string, text: string): ChatMessage {
      const row = insertStmt.get(author, text) as unknown as MessageRow | undefined;
      if (!row) throw new Error('Insert returned no row');
      return toChatMessage(row);
    },

    getRecentMessages(limit: number): ChatMessage[] {
      return (recentStmt.all(limit) as unknown as MessageRow[]).map(toChatMessage);
    },

    isHealthy(): boolean {
      try {
        return pingStmt.get() !== undefined;
      } catch {
        return false;
      }
    },

    close(): void {
      if (db.isOpen) db.close();
    },
  };
}
