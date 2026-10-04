import { MyKanbanBoard } from "@/app/(dashboard)/kanban/_components/kanban";


export default async function Home() {
  const response = await fetch("http://localhost:3000/kanban/api")
  const { columns, tasks }: {
    columns: {
      id: string;
      label: string;
    }[], tasks: {
      id: string;
      title: string;
      columnId: string;
      position: number;
    }[]
  } = await response.json()


  return <MyKanbanBoard columns={columns} tasks={tasks} />
}
