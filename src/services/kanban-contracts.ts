export interface Board {
    id: string;
    name: string;
}

export interface BoardColumn {
    id: string;
    name: string;
    position: number;
}

export interface BoardTask {
    id: string;
    title: string;
    description: string | null;
    columnId: string;
    assigneeId: string | null;
    position: number;
    createdAt: string;
    dueDate: string | null;
    completedAt: string | null;
}

export interface BoardSnapshot {
    board: Board;
    columns: BoardColumn[];
    tasks: BoardTask[];
}

export interface CreateTaskInput {
    title: string;
    description?: string | null;
    assigneeId?: string | null;
    dueDate?: string | null;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string | null;
    assigneeId?: string | null;
    dueDate?: string | null;
    completedAt?: string | null;
}

export interface MoveTaskInput {
    taskId: string;
    columnId: string;
    position: number;
}

/** Persistence port used by board use cases; contains no SQL or database types. */
export interface BoardRepository {
    listBoards(): string[];
    findBoardByName(name: string): Board | null;
    createBoard(name: string): Board;
    renameBoard(id: string, name: string): Board | null;
    deleteBoard(id: string): boolean;
}

/** Persistence port for column use cases. */
export interface ColumnRepository {
    getColumns(boardId: string): BoardColumn[];
    createColumn(boardId: string, name: string): BoardColumn | null;
    renameColumn(
        boardId: string,
        columnId: string,
        name: string,
    ): BoardColumn | null;
    deleteColumn(boardId: string, columnId: string): boolean;
}

/** Persistence port for task use cases. */
export interface TaskRepository {
    getTasks(boardId: string): BoardTask[];
    createTask(
        boardId: string,
        columnId: string,
        input: CreateTaskInput,
    ): BoardTask | null;
    updateTask(
        boardId: string,
        taskId: string,
        input: UpdateTaskInput,
    ): BoardTask | null;
    deleteTask(boardId: string, taskId: string): boolean;
    moveTask(
        boardId: string,
        input: MoveTaskInput,
    ): "moved" | "task-not-found" | "column-not-found";
}
