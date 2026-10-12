import type Database from "better-sqlite3";
import type {
    BoardColumn,
    ColumnRepository,
} from "@/services/kanban-contracts";
import { getDb } from "@/lib/db";
import { Repository } from "./common-repository";

export type ColumnRow = { id: number; name: string; position: number };

export function mapColumn(row: ColumnRow): BoardColumn {
    return { id: String(row.id), name: row.name, position: row.position };
}

export class SqliteColumnRepository extends Repository
    implements ColumnRepository {
    constructor(db: Database.Database = getDb()) {
        super(db);
    }

    getColumns(boardId: string) {
        const id = this.toIntegerId(boardId);
        if (id === null) return [];
        return this.db.prepare<[number], ColumnRow>(
            "SELECT id, name, position FROM columns WHERE board_id = ? ORDER BY position, id",
        ).all(id).map(mapColumn);
    }

    createColumn(boardId: string, name: string) {
        const id = this.toIntegerId(boardId);
        if (id === null) return null;
        const position = this.db.prepare<[number], { next_position: number }>(
            "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM columns WHERE board_id = ?",
        ).get(id)?.next_position;
        if (position === undefined) return null;
        const result = this.db.prepare<[string, number, number]>(
            "INSERT INTO columns (name, position, board_id) VALUES (?, ?, ?)",
        ).run(name, position, id);
        return { id: String(result.lastInsertRowid), name, position };
    }

    renameColumn(boardId: string, columnId: string, name: string) {
        const board = this.toIntegerId(boardId);
        const column = this.toIntegerId(columnId);
        if (board === null || column === null) return null;
        const result = this.db.prepare<[string, number, number]>(
            "UPDATE columns SET name = ? WHERE id = ? AND board_id = ?",
        ).run(name, column, board);
        if (!result.changes) return null;
        const row = this.db.prepare<[number, number], ColumnRow>(
            "SELECT id, name, position FROM columns WHERE id = ? AND board_id = ?",
        ).get(column, board);
        return row ? mapColumn(row) : null;
    }

    deleteColumn(boardId: string, columnId: string) {
        const board = this.toIntegerId(boardId);
        const column = this.toIntegerId(columnId);
        if (board === null || column === null) return false;
        return this.deleteColumnTransaction.immediate(board, column);
    }

    private readonly deleteColumnTransaction = this.db.transaction(
        (boardId: number, columnId: number): boolean => {
            const column = this.db.prepare<
                [number, number],
                { position: number }
            >(
                "SELECT position FROM columns WHERE id = ? AND board_id = ?",
            ).get(columnId, boardId);
            if (!column) return false;

            this.db.prepare<[number, number]>(
                "DELETE FROM columns WHERE id = ? AND board_id = ?",
            ).run(columnId, boardId);
            this.db.prepare<[number, number]>(
                "UPDATE columns SET position = position - 1 WHERE board_id = ? AND position > ?",
            ).run(boardId, column.position);
            return true;
        },
    );
}
