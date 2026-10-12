import { NotFoundError } from "@/errors";
import type {
    BoardColumn,
    BoardRepository,
    ColumnRepository,
} from "@/services/kanban-contracts";

export class ColumnNotFoundError extends NotFoundError {
    constructor(columnId: string) {
        super(`Column not found: ${columnId}`);
    }
}

export class ColumnService {
    constructor(
        private readonly boardRepository: Pick<
            BoardRepository,
            "findBoardByName"
        >,
        private readonly columnRepository: ColumnRepository,
    ) {}

    createColumn(boardName: string, name: string): BoardColumn {
        const board = this.boardRepository.findBoardByName(boardName);
        if (!board) throw new NotFoundError(`Board not found: ${boardName}`);

        const normalizedName = name.trim();
        if (!normalizedName) throw new TypeError("Column name is required.");

        const column = this.columnRepository.createColumn(
            board.id,
            normalizedName,
        );
        if (!column) {
            throw new NotFoundError(
                `Could not create column in board: ${boardName}`,
            );
        }
        return column;
    }

    renameColumn(
        boardName: string,
        columnId: string,
        name: string,
    ): BoardColumn {
        const board = this.boardRepository.findBoardByName(boardName);
        if (!board) throw new NotFoundError(`Board not found: ${boardName}`);

        const normalizedName = name.trim();
        if (!normalizedName) throw new TypeError("Column name is required.");

        const column = this.columnRepository.renameColumn(
            board.id,
            columnId,
            normalizedName,
        );
        if (!column) throw new ColumnNotFoundError(columnId);
        return column;
    }

    deleteColumn(boardName: string, columnId: string): void {
        const board = this.boardRepository.findBoardByName(boardName);
        if (!board) throw new NotFoundError(`Board not found: ${boardName}`);
        if (!this.columnRepository.deleteColumn(board.id, columnId)) {
            throw new ColumnNotFoundError(columnId);
        }
    }
}
