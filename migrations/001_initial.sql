-- Table to track migrations (so you don't run the same script twice)
CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pin_hash TEXT
);

-- Board columns
CREATE TABLE IF NOT EXISTS columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position INTEGER NOT NULL
);

-- Tasks with position inside the column
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    column_id INTEGER NOT NULL,
    assignee_id INTEGER,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    due_date TEXT,
    completed_at TEXT,
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_column_position ON tasks(column_id, position);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);