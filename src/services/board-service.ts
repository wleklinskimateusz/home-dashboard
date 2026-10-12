import { NotFoundError } from "@/errors";
import type {
    Board,
    BoardRepository,
    BoardSnapshot,
    ColumnRepository,
    TaskRepository,
} from "@/services/kanban-contracts";

export class BoardNotFoundError extends NotFoundError {
    constructor(boardName: string) {
        super(`Board not found: ${boardName}`);
    }
}

export class BoardService {
    constructor(
        private readonly boardRepository: BoardRepository,
        private readonly columnRepository: ColumnRepository,
        private readonly taskRepository: TaskRepository,
    ) {}

    listBoards(): string[] {
        return this.boardRepository.listBoards();
    }

    getBoard(name: string): BoardSnapshot | null {
        const board = this.boardRepository.findBoardByName(name);
        if (!board) return null;

        return {
            board,
            columns: this.columnRepository.getColumns(board.id),
            tasks: this.taskRepository.getTasks(board.id),
        };
    }

    createBoard(name: string): Board {
        const normalizedName = name.trim();
        if (!normalizedName) throw new TypeError("Board name is required.");

        const board = this.boardRepository.createBoard(normalizedName);
        this.columnRepository.createColumn(board.id, "To Do");
        this.columnRepository.createColumn(board.id, "Doing");
        this.columnRepository.createColumn(board.id, "Done");
        return board;
    }

    renameBoard(currentName: string, nextName: string): Board {
        const board = this.boardRepository.findBoardByName(currentName);
        if (!board) throw new BoardNotFoundError(currentName);

        const normalizedName = nextName.trim();
        if (!normalizedName) throw new TypeError("Board name is required.");

        const renamed = this.boardRepository.renameBoard(
            board.id,
            normalizedName,
        );
        if (!renamed) throw new BoardNotFoundError(currentName);
        return renamed;
    }

    deleteBoard(name: string): void {
        const board = this.boardRepository.findBoardByName(name);
        if (!board) throw new BoardNotFoundError(name);
        this.boardRepository.deleteBoard(board.id);
    }
}
