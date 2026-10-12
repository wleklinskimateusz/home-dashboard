import type Database from "better-sqlite3";
import type {
    BoardTask,
    CreateTaskInput,
    MoveTaskInput,
    TaskRepository,
    UpdateTaskInput,
} from "@/services/kanban-contracts";
import { getDb } from "@/lib/db";
import { Repository } from "./common-repository";

export type TaskRow = {
    id: number;
    title: string;
    description: string | null;
    column_id: number;
    assignee_id: number | null;
    position: number;
    created_at: string;
    due_date: string | null;
    completed_at: string | null;
};

export function mapTask(row: TaskRow): BoardTask {
    return {
        id: String(row.id),
        title: row.title,
        description: row.description,
        columnId: String(row.column_id),
        assigneeId: row.assignee_id === null ? null : String(row.assignee_id),
        position: row.position,
        createdAt: row.created_at,
        dueDate: row.due_date,
        completedAt: row.completed_at,
    };
}

type StoredTaskRow = { column_id: number; position: number };

export class SqliteTaskRepository extends Repository implements TaskRepository {
    constructor(db: Database.Database = getDb()) {
        super(db);
    }

    getTasks(boardId: string) {
        const id = this.toIntegerId(boardId);
        if (id === null) return [];
        return this.db.prepare<[number], TaskRow>(
            `SELECT id, title, description, column_id, assignee_id, position,
                    created_at, due_date, completed_at
             FROM tasks WHERE board_id = ? ORDER BY column_id, position, id`,
        ).all(id).map(mapTask);
    }

    createTask(boardId: string, columnId: string, input: CreateTaskInput) {
        const board = this.toIntegerId(boardId);
        const column = this.toIntegerId(columnId);
        const assignee = input.assigneeId == null
            ? null
            : this.toIntegerId(input.assigneeId);
        if (
            board === null || column === null ||
            (input.assigneeId != null && assignee === null)
        ) return null;

        const position = this.db.prepare<
            [number, number],
            { next_position: number }
        >(
            "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM tasks WHERE board_id = ? AND column_id = ?",
        ).get(board, column)?.next_position;
        if (position === undefined) return null;

        const inserted = this.db.prepare<[
            string,
            string | null,
            number,
            number,
            number | null,
            number,
            string | null,
            number,
            number,
        ]>(
            `INSERT INTO tasks (title, description, board_id, column_id, assignee_id, position, due_date)
             SELECT ?, ?, ?, ?, ?, ?, ?
             WHERE EXISTS (SELECT 1 FROM columns WHERE id = ? AND board_id = ?)`,
        ).run(
            input.title,
            input.description ?? null,
            board,
            column,
            assignee,
            position,
            input.dueDate ?? null,
            column,
            board,
        );
        if (!inserted.changes) return null;
        return this.getTask(board, Number(inserted.lastInsertRowid));
    }

    updateTask(boardId: string, taskId: string, input: UpdateTaskInput) {
        const board = this.toIntegerId(boardId);
        const task = this.toIntegerId(taskId);
        if (board === null || task === null) return null;

        const fields: string[] = [];
        const values: (string | number | null)[] = [];
        if (input.title !== undefined) {
            fields.push("title = ?");
            values.push(input.title);
        }
        if (input.description !== undefined) {
            fields.push("description = ?");
            values.push(input.description);
        }
        if (input.assigneeId !== undefined) {
            const assignee = input.assigneeId === null
                ? null
                : this.toIntegerId(input.assigneeId);
            if (input.assigneeId !== null && assignee === null) return null;
            fields.push("assignee_id = ?");
            values.push(assignee);
        }
        if (input.dueDate !== undefined) {
            fields.push("due_date = ?");
            values.push(input.dueDate);
        }
        if (input.completedAt !== undefined) {
            fields.push("completed_at = ?");
            values.push(input.completedAt);
        }

        if (fields.length) {
            values.push(task, board);
            const result = this.db.prepare(
                `UPDATE tasks SET ${
                    fields.join(", ")
                } WHERE id = ? AND board_id = ?`,
            ).run(...values);
            if (!result.changes) return null;
        }
        return this.getTask(board, task);
    }

    deleteTask(boardId: string, taskId: string) {
        const board = this.toIntegerId(boardId);
        const task = this.toIntegerId(taskId);
        if (board === null || task === null) return false;
        return this.deleteTaskTransaction.immediate(board, task);
    }

    moveTask(
        boardId: string,
        input: MoveTaskInput,
    ): "moved" | "task-not-found" | "column-not-found" {
        const board = this.toIntegerId(boardId);
        const task = this.toIntegerId(input.taskId);
        const column = this.toIntegerId(input.columnId);
        if (board === null || task === null) return "task-not-found";
        if (column === null) return "column-not-found";
        return this.moveTaskTransaction.immediate(
            board,
            task,
            column,
            input.position,
        );
    }

    private getTask(boardId: number, taskId: number) {
        const row = this.db.prepare<[number, number], TaskRow>(
            `SELECT id, title, description, column_id, assignee_id, position,
                    created_at, due_date, completed_at
             FROM tasks WHERE board_id = ? AND id = ?`,
        ).get(boardId, taskId);
        return row ? mapTask(row) : null;
    }

    private readonly deleteTaskTransaction = this.db.transaction(
        (boardId: number, taskId: number): boolean => {
            const task = this.db.prepare<[number, number], StoredTaskRow>(
                "SELECT column_id, position FROM tasks WHERE id = ? AND board_id = ?",
            ).get(taskId, boardId);
            if (!task) return false;

            this.db.prepare<[number, number]>(
                "DELETE FROM tasks WHERE id = ? AND board_id = ?",
            ).run(taskId, boardId);
            this.db.prepare<[number, number, number]>(
                "UPDATE tasks SET position = position - 1 WHERE board_id = ? AND column_id = ? AND position > ?",
            ).run(boardId, task.column_id, task.position);
            return true;
        },
    );

    private readonly moveTaskTransaction = this.db.transaction(
        (
            boardId: number,
            taskId: number,
            columnId: number,
            requestedPosition: number,
        ): "moved" | "task-not-found" | "column-not-found" => {
            const task = this.db.prepare<[number, number], StoredTaskRow>(
                "SELECT column_id, position FROM tasks WHERE id = ? AND board_id = ?",
            ).get(taskId, boardId);
            if (!task) return "task-not-found";

            const targetColumn = this.db.prepare<
                [number, number],
                { id: number }
            >(
                "SELECT id FROM columns WHERE id = ? AND board_id = ?",
            ).get(columnId, boardId);
            if (!targetColumn) return "column-not-found";

            const sameColumn = task.column_id === columnId;
            const targetCount = this.db.prepare<
                [number, number, number],
                { count: number }
            >(
                "SELECT COUNT(*) AS count FROM tasks WHERE board_id = ? AND column_id = ? AND id != ?",
            ).get(boardId, columnId, taskId)?.count ?? 0;
            const position = Math.min(requestedPosition, targetCount);

            if (sameColumn && position < task.position) {
                this.db.prepare<[number, number, number, number]>(
                    "UPDATE tasks SET position = position + 1 WHERE board_id = ? AND column_id = ? AND position >= ? AND id != ?",
                ).run(boardId, columnId, position, taskId);
            } else if (sameColumn && position > task.position) {
                this.db.prepare<[number, number, number, number]>(
                    "UPDATE tasks SET position = position - 1 WHERE board_id = ? AND column_id = ? AND position > ? AND id != ?",
                ).run(boardId, columnId, task.position, taskId);
            } else if (!sameColumn) {
                this.db.prepare<[number, number, number]>(
                    "UPDATE tasks SET position = position - 1 WHERE board_id = ? AND column_id = ? AND position > ?",
                ).run(boardId, task.column_id, task.position);
                this.db.prepare<[number, number, number]>(
                    "UPDATE tasks SET position = position + 1 WHERE board_id = ? AND column_id = ? AND position >= ?",
                ).run(boardId, columnId, position);
            }

            this.db.prepare<[number, number, number, number]>(
                "UPDATE tasks SET column_id = ?, position = ? WHERE id = ? AND board_id = ?",
            ).run(columnId, position, taskId, boardId);
            return "moved";
        },
    );
}
