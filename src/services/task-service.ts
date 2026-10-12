import { NotFoundError } from "@/errors";
import type {
    BoardRepository,
    BoardTask,
    CreateTaskInput,
    MoveTaskInput,
    TaskRepository,
    UpdateTaskInput,
} from "@/services/kanban-contracts";

export class TaskService {
    constructor(
        private readonly boardRepository: Pick<
            BoardRepository,
            "findBoardByName"
        >,
        private readonly taskRepository: TaskRepository,
    ) {}

    createTask(
        boardName: string,
        columnId: string,
        input: CreateTaskInput,
    ): BoardTask {
        const board = this.boardRepository.findBoardByName(boardName);
        if (!board) throw new NotFoundError(`Board not found: ${boardName}`);

        const title = input.title.trim();
        if (!title) throw new TypeError("Task title is required.");

        const task = this.taskRepository.createTask(board.id, columnId, {
            ...input,
            title,
        });
        if (!task) throw new NotFoundError(`Column not found: ${columnId}`);
        return task;
    }

    updateTask(
        boardName: string,
        taskId: string,
        input: UpdateTaskInput,
    ): BoardTask {
        const board = this.boardRepository.findBoardByName(boardName);
        if (!board) throw new NotFoundError(`Board not found: ${boardName}`);

        const normalized = { ...input };
        if (input.title !== undefined) {
            normalized.title = input.title.trim();
            if (!normalized.title) {
                throw new TypeError("Task title is required.");
            }
        }

        const task = this.taskRepository.updateTask(
            board.id,
            taskId,
            normalized,
        );
        if (!task) throw new NotFoundError(`Task not found: ${taskId}`);
        return task;
    }

    moveTask(boardName: string, input: MoveTaskInput): void {
        if (!Number.isFinite(input.position)) {
            throw new TypeError("Task position must be a finite number.");
        }

        const board = this.boardRepository.findBoardByName(boardName);
        if (!board) throw new NotFoundError(`Board not found: ${boardName}`);

        const result = this.taskRepository.moveTask(board.id, {
            ...input,
            position: Math.max(0, Math.trunc(input.position)),
        });
        if (result === "task-not-found") {
            throw new NotFoundError(`Task not found: ${input.taskId}`);
        }
        if (result === "column-not-found") {
            throw new NotFoundError(`Column not found: ${input.columnId}`);
        }
    }

    deleteTask(boardName: string, taskId: string): void {
        const board = this.boardRepository.findBoardByName(boardName);
        if (!board) throw new NotFoundError(`Board not found: ${boardName}`);
        if (!this.taskRepository.deleteTask(board.id, taskId)) {
            throw new NotFoundError(`Task not found: ${taskId}`);
        }
    }
}
