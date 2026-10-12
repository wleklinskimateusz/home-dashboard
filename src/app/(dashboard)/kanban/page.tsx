import { getKanbanServices } from "@/services/kanban-service-provider";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const boards = getKanbanServices().boards.listBoards()
  return (
    <>
      <div className="flex flex-col gap-4">
        {boards.map((board) => (
          <Link key={board} href={`/kanban/${board}`} className="p-4 bg-gray-200 rounded hover:bg-gray-300 transition">
            {board}
          </Link>
        ))}
      </div>

    </>
  )
}
