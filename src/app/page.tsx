import { MyKanbanBoard } from "@/components/kanban";


export default async function Home() {
  const response = await fetch("http://localhost:3000/api")
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
