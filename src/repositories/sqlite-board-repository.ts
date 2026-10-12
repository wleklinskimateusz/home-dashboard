import type Database from "better-sqlite3";
import type { Board, BoardRepository } from "@/services/kanban-contracts";
import { getDb } from "@/lib/db";
import { Repository } from "./common-repository";

export type BoardRow = { id: number; name: string };
export function mapBoard(row: BoardRow): Board {
    return { id: String(row.id), name: row.name };
}

export class SqliteBoardRepository extends Repository
    implements BoardRepository {
    constructor(db: Database.Database = getDb()) {
        super(db);
    }

    listBoards() {
        return this.db.prepare<[], { name: string }>(
            "SELECT name FROM boards ORDER BY name, id",
        ).all().map(({ name }) => name);
    }

    findBoardByName(name: string) {
        const row = this.db.prepare<[string], BoardRow>(
            "SELECT id, name FROM boards WHERE name = ?",
        ).get(name);
        return row ? mapBoard(row) : null;
    }

    createBoard(name: string) {
        const result = this.db.prepare<[string]>(
            "INSERT INTO boards (name) VALUES (?)",
        ).run(name);
        return { id: String(result.lastInsertRowid), name };
    }

    renameBoard(id: string, name: string) {
        const dbId = this.toIntegerId(id);
        if (dbId === null) return null;
        const result = this.db.prepare<[string, number]>(
            "UPDATE boards SET name = ? WHERE id = ?",
        ).run(name, dbId);
        return result.changes ? { id, name } : null;
    }

    deleteBoard(id: string) {
        const dbId = this.toIntegerId(id);
        if (dbId === null) return false;
        return this.db.prepare<[number]>(
            "DELETE FROM boards WHERE id = ?",
        ).run(dbId).changes > 0;
    }
}
