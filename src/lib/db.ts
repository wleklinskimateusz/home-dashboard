// lib/db.ts
import Database from "better-sqlite3";

// Table row types
export interface User {
    id: number;
    name: string;
    pin_hash: string | null;
}

export interface Column {
    id: number;
    name: string;
    position: number;
}

export interface Task {
    id: number;
    title: string;
    description: string | null;
    column_id: number;
    assignee_id: number | null;
    position: number;
    created_at: string;
    due_date: string | null;
    completed_at: string | null;
}

// Database singleton
let db: Database.Database | null = null;

export function getDb(): Database.Database {
    if (!db) {
        db = new Database(process.env.DATABASE_PATH || "./kanban.db");
        db.pragma("journal_mode = WAL");
        db.pragma("foreign_keys = ON");
    }
    return db;
}
