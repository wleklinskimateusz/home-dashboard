import { SqliteBoardRepository } from "@/repositories/sqlite-board-repository";
import { SqliteColumnRepository } from "@/repositories/sqlite-column-repository";
import { SqliteTaskRepository } from "@/repositories/sqlite-task-repository";
import { getDb } from "@/lib/db";
import { BoardService } from "@/services/board-service";
import { ColumnService } from "@/services/column-service";
import { TaskService } from "@/services/task-service";

/** Composition root: wire application use cases to the SQLite adapter. */
export function getKanbanServices() {
    const db = getDb();
    const boards = new SqliteBoardRepository(db);
    const columns = new SqliteColumnRepository(db);
    const tasks = new SqliteTaskRepository(db);

    return {
        boards: new BoardService(boards, columns, tasks),
        columns: new ColumnService(boards, columns),
        tasks: new TaskService(boards, tasks),
    };
}
