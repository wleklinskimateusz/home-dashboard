// scripts/migrate.js
import Database from "better-sqlite3";
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || "./kanban.db";
const MIGRATIONS_DIR = join(__dirname, "../migrations");

function runMigrations() {
  const db = new Database(DB_PATH);

  // 🔥 Enable WAL mode – MUST be done outside any transaction
  db.pragma("journal_mode = WAL");

  // Ensure the migrations table exists (this is not inside a transaction)
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = db.prepare("SELECT name FROM _migrations").pluck().all();
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let count = 0;
  for (const file of files) {
    if (applied.includes(file)) {
      console.log(`⏭️  Skipping ${file} (already applied)`);
      continue;
    }

    console.log(`🔄 Applying ${file}...`);
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");

    db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
    })();

    count++;
  }

  console.log(`✅ Migration complete. Applied ${count} new migration(s).`);
  db.close();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations();
}

export default runMigrations;
