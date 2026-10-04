export default async function KanbanBoardPage({ params }: { params: Promise<{ boardName: string }> }) {
    const { boardName } = await params

    return <>{boardName}</>

}