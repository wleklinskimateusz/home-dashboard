import { notFound } from "next/navigation";
import { getKanbanServices } from "@/services/kanban-service-provider";
import { MyKanbanBoard } from "../_components/kanban";

export default async function KanbanBoardPage({ params }: { params: Promise<{ boardName: string }> }) {
    const { boardName } = await params

    const board = getKanbanServices().boards.getBoard(boardName);
    if (!board) notFound();


    return (
        <>
            <MyKanbanBoard boardName={boardName} columns={board.columns} tasks={board.tasks} />
        </>
    )
}