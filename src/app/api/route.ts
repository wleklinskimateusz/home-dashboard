const columns = [
    { id: "to-do", label: "To Do" },
    { id: "doing", label: "Doing" },
    { id: "done", label: "Done" },
];

const tasks = [
    { id: "task-1", title: "Design Homepage", columnId: "to-do" },
    { id: "task-2", title: "Setup Database", columnId: "to-do" },
    { id: "task-3", title: "Build Auth Flow", columnId: "doing" },
    { id: "task-4", title: "Deploy to Production", columnId: "done" },
];

export function GET() {
    return Response.json({ columns, tasks });
}

type DropCardParams = {
    cardId: string;
    fromColumnId: string;
    toColumnId: string;
    taskAbove: string | null;
    taskBelow: string | null;
    position: number;
};

export async function POST(req: Request) {
    const { move } = (await req.json()) as {
        move: DropCardParams;
    };

    const task = tasks.find(({ id }) => move.cardId === id);
    if (!task) return Response.json({ error: "Not Found" }, { status: 404 });

    task.columnId = move.toColumnId;

    return Response.json({ success: true }, { status: 200 });
}
