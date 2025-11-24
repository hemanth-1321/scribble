"use client";

import { useState } from "react";
import CanvasBoard from "@/components/CanvasBoard";
import PlayersSection from "@/components/PlayersSection";
import ChatSection from "@/components/ChatSection";

export default function Page({ params }: any) {
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil");

  const players = [
    { id: "1", name: "You", points: 1200, emoji: "😎", isDrawing: true },
    { id: "2", name: "Alex", points: 900, emoji: "🤠" },
  ];

  const messages = [
    { id: "1", sender: "Alex", text: "Hello!" },
    { id: "2", sender: "You", text: "Hi!" },
  ];

  return (
    <div className="h-screen p-4 flex gap-4 bg-gray-100">
      <PlayersSection players={players} />

      <div className="flex-1 flex flex-col relative bg-white rounded-2xl border shadow-sm overflow-hidden">
        <CanvasBoard tool={tool} />

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="flex gap-3 bg-white shadow px-4 py-2 rounded-xl pointer-events-auto">
            {/* Pencil */}
            <button
              onClick={() => setTool("pencil")}
              className={`px-3 py-2 rounded-lg 
      ${tool === "pencil" ? "bg-blue-200" : "bg-gray-100"}`}
            >
              ✏️
            </button>

            {/* Eraser */}
            <button
              onClick={() => setTool("eraser")}
              className={`px-3 py-2 rounded-lg 
      ${tool === "eraser" ? "bg-blue-200" : "bg-gray-100"}`}
            >
              🧽
            </button>

            {/* CLEAR (not selectable) */}
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("clear-canvas"))
              }
              className="px-3 py-2 rounded-lg bg-red-100 active:bg-red-200"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <ChatSection
        messages={messages}
        onSend={(msg) => console.log("Send:", msg)}
      />
    </div>
  );
}
