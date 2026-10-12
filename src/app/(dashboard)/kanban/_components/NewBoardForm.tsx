"use client"

import { Input } from "@/components/ui/input";
import { useState } from "react";

export function NewBoardForm() {
    const [isAddBoardClicked, setIsAddBoardClicked] = useState(false);

    if (!isAddBoardClicked) {
        return (
            <button
                className="p-4 bg-gray-200 rounded hover:bg-gray-300 transition"
                onClick={() => setIsAddBoardClicked(true)}
            >
                + Add Board
            </button>
        );
    }

    return (
        <form className="flex flex-col gap-2" action={async (formData) => {
            try {
                const response = await fetch("/api/boards", {
                    method: "POST",
                    body: JSON.stringify({ name: formData.get("boardName") }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to create board");
                }

                setIsAddBoardClicked(false);
            } catch (error) {
                console.error("Error creating board:", error);
            }
        }}>

            <Input
                type="text"
                name="boardName"
                id="boardName"
                placeholder="Board Name"
            />
        </form>
    )
}