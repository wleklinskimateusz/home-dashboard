// scripts/seed.js
import Database from "better-sqlite3";

const DB_PATH = process.env.DATABASE_PATH || "./kanban.db";
const db = new Database(DB_PATH);

// Enable WAL (optional but recommended)
db.pragma("journal_mode = WAL");

// Seed users – only insert if they don't exist
const users = [{ name: "Mateusz" }, { name: "Iza" }];

const insertStmt = db.prepare(`
  INSERT OR IGNORE INTO users (name, pin_hash) 
  VALUES (?, NULL)
`);

for (const user of users) {
  const result = insertStmt.run(user.name);
  if (result.changes > 0) {
    console.log(`✅ Inserted user: ${user.name}`);
  } else {
    console.log(`⏭️  User ${user.name} already exists, skipped.`);
  }
}

// Seed a default board and its columns – only insert missing rows
db.prepare(
  `
  INSERT OR IGNORE INTO boards (name)
  VALUES (?)
`,
).run("default");

const board = db.prepare("SELECT id FROM boards WHERE name = ?").get("default");
const columns = [
  { name: "To Do", position: 0 },
  { name: "Doing", position: 1 },
  { name: "Done", position: 2 },
];
const insertColumnStmt = db.prepare(`
  INSERT OR IGNORE INTO columns (name, position, board_id)
  VALUES (?, ?, ?)
`);

for (const column of columns) {
  insertColumnStmt.run(column.name, column.position, board.id);
}

db.close();
console.log("✅ Seed complete.");
