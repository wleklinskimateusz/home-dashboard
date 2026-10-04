"use client"
import { useState } from "react";
import { Kanban } from "react-kanban-kit";
import type { BoardData } from "react-kanban-kit";

type DropCardParams = {
    cardId: string;
    fromColumnId: string;
    toColumnId: string;
    taskAbove: string | null;
    taskBelow: string | null;
    position: number;
};

const getNewValue = (oldValue: BoardData, move: DropCardParams) => {
    const newValue = { ...oldValue }

    newValue[move.cardId].parentId = move.toColumnId;
    newValue[move.fromColumnId].children = newValue[move.fromColumnId].children
        .filter((child) => child !== move.cardId);

    newValue[move.fromColumnId].totalChildrenCount -= 1;

    newValue[move.toColumnId].children = newValue[move.toColumnId].children
        .toSpliced(move.position, 0, move.cardId);

    newValue[move.toColumnId].totalChildrenCount += 1;

    return newValue;
}

const buildBoardData = (columns: {
    id: string;
    label: string;
}[], tasks: {
    id: string;
    title: string;
    columnId: string;
    position: number;
}[]): BoardData => {
    return {
        root: { id: "root", title: "Root", children: columns.map(({ id }) => id), totalChildrenCount: columns.length, parentId: null },
        ...Object.fromEntries(columns.map(column => {
            const colTasks = tasks.filter(task => task.columnId === column.id);
            return { id: column.id, title: column.label, children: colTasks.map(task => task.id), totalChildrenCount: colTasks.length, parent: "root" }
        }).map(obj => [obj.id, obj])),
        ...Object.fromEntries(tasks.map(task => {
            return { id: task.id, title: task.title, children: [], totalChildrenCount: 0, type: "card", parent: task.columnId }
        }).map(obj => [obj.id, obj])),
    }
}

export const MyKanbanBoard = ({ columns, tasks }: {

    columns: {
        id: string;
        label: string;
    }[];
    tasks: {
        id: string;
        title: string;
        columnId: string;
        position: number;
    }[];

}) => {

    const [dataSource, setDataSource] = useState(buildBoardData(columns, tasks))




    return (
        <Kanban
            dataSource={dataSource}
            configMap={{
                card: {
                    render: ({ data }) => (
                        <div className="kanban-card">
                            <h3>{data.title}</h3>
                            {data.content?.description && <p>{data.content.description}</p>}
                            {data.content?.priority && (
                                <span className={`priority ${data.content.priority}`}>
                                    {data.content.priority}
                                </span>
                            )}
                        </div>
                    ),
                    isDraggable: true,
                },
            }}
            onCardMove={(move) => {
                setDataSource(getNewValue(dataSource, move))

                fetch("/kanban/api", { method: "POST", body: JSON.stringify({ oldValue: dataSource, move }) }).then(response => {
                    if (!response.ok) { throw Error("LOL") }
                })


            }}
        />
    );
};
