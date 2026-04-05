import { createClient, type Client, type InValue } from '@libsql/client';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = path.join(dataDir, 'chores.db');

export const db: Client = createClient({
  url: `file:${DB_PATH}`,
});

export async function initDb(): Promise<void> {
  await db.executeMultiple(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      recurrence_type TEXT NOT NULL DEFAULT 'none',
      recurrence_config TEXT NOT NULL DEFAULT '{}',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chore_occurrences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chore_id INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
      due_date TEXT NOT NULL,
      assigned_to INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      completed_at TEXT,
      completed_by INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
      UNIQUE(chore_id, due_date)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      occurrence_id INTEGER NOT NULL REFERENCES chore_occurrences(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('slack_webhook_url', '');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('teams_webhook_url', '');
  `);

  // Run column migrations individually; ignore errors when column already exists
  const migrations = [
    'ALTER TABLE chores ADD COLUMN default_assignee INTEGER REFERENCES team_members(id) ON DELETE SET NULL',
    'ALTER TABLE chores ADD COLUMN target_date TEXT',
    "ALTER TABLE team_members ADD COLUMN color TEXT NOT NULL DEFAULT ''",
  ];
  for (const sql of migrations) {
    try {
      await db.execute(sql);
    } catch {
      // Column already exists — safe to ignore
    }
  }
}

// Typed helper to extract rows as plain objects
export function rows<T>(result: Awaited<ReturnType<Client['execute']>>): T[] {
  return result.rows as unknown as T[];
}

export function row<T>(result: Awaited<ReturnType<Client['execute']>>): T | undefined {
  return result.rows[0] as unknown as T | undefined;
}

// Convenience wrapper for parameterized queries
export async function query<T>(sql: string, args: InValue[] = []): Promise<T[]> {
  const result = await db.execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function queryOne<T>(sql: string, args: InValue[] = []): Promise<T | undefined> {
  const result = await db.execute({ sql, args });
  return result.rows[0] as unknown as T | undefined;
}

export async function run(sql: string, args: InValue[] = []): Promise<{ lastInsertRowid: bigint | number }> {
  const result = await db.execute({ sql, args });
  return { lastInsertRowid: result.lastInsertRowid ?? 0 };
}
