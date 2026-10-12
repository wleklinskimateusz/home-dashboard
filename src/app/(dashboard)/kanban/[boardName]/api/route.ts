import { getKanbanServices } from "@/services/kanban-service-provider";

type RouteContext = { params: Promise<{ boardName: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
    const { boardName } = await params;
    const board = getKanbanServices().boards.getBoard(boardName);

    if (!board) {
        return Response.json({ error: "Board not found" }, { status: 404 });
    }

    return Response.json({
        board: board.board,
        columns: board.columns.map(({ id, name }) => ({ id, label: name })),
        tasks: board.tasks.map(({ id, title, columnId, position }) => ({
            id,
            title,
            columnId,
            position,
        })),
    });
}

export async function POST(request: Request, { params }: RouteContext) {
    const { boardName } = await params;
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || !("move" in body)) {
        return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const move = body.move;
    if (
        !move || typeof move !== "object" ||
        !("cardId" in move) || typeof move.cardId !== "string" ||
        !("toColumnId" in move) || typeof move.toColumnId !== "string" ||
        !("position" in move) || typeof move.position !== "number"
    ) {
        return Response.json({ error: "Invalid move" }, { status: 400 });
    }

    try {
        getKanbanServices().tasks.moveTask(boardName, {
            taskId: move.cardId,
            columnId: move.toColumnId,
            position: move.position,
        });
    } catch (error) {
        if (error instanceof Error && error.name === "NotFoundError") {
            return Response.json({ error: error.message }, { status: 404 });
        }
        throw error;
    }

    return Response.json({ success: true });
}
