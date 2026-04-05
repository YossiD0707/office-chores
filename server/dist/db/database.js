"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initDb = initDb;
exports.rows = rows;
exports.row = row;
exports.query = query;
exports.queryOne = queryOne;
exports.run = run;
const client_1 = require("@libsql/client");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dataDir = path_1.default.join(__dirname, '..', '..', 'data');
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
const DB_PATH = path_1.default.join(dataDir, 'chores.db');
exports.db = (0, client_1.createClient)({
    url: `file:${DB_PATH}`,
});
async function initDb() {
    await exports.db.executeMultiple(`
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
            await exports.db.execute(sql);
        }
        catch {
            // Column already exists — safe to ignore
        }
    }
}
// Typed helper to extract rows as plain objects
function rows(result) {
    return result.rows;
}
function row(result) {
    return result.rows[0];
}
// Convenience wrapper for parameterized queries
async function query(sql, args = []) {
    const result = await exports.db.execute({ sql, args });
    return result.rows;
}
async function queryOne(sql, args = []) {
    const result = await exports.db.execute({ sql, args });
    return result.rows[0];
}
async function run(sql, args = []) {
    const result = await exports.db.execute({ sql, args });
    return { lastInsertRowid: result.lastInsertRowid ?? 0 };
}
