"use client";
import * as React from "react";
import { useState } from "react";
import CanvasBoard from "@/components/CanvasBoard";
import PlayersSection from "@/components/PlayersSection";
import ChatSection from "@/components/ChatSection";
import { Tool } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
  const [tool, setTool] = useState<Tool>("pencil");
  const player = localStorage.getItem("playerId");
  const { id } = React.use(params);
  const roomId = id;
  console.log(roomId);
  const playerId = player!;

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
        <CanvasBoard tool={tool} roomId={roomId} playerId={playerId} />

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="flex gap-3 bg-white shadow px-4 py-2 rounded-xl pointer-events-auto ">
            <button
              onClick={() => setTool("pencil")}
              className={`px-3 py-2 rounded-lg ${
                tool === "pencil" ? "bg-blue-200" : "bg-gray-100"
              } cursor-pointer`}
            >
              ✏️
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`px-3 py-2 rounded-lg ${
                tool === "eraser" ? "bg-blue-200" : "bg-gray-100"
              } cursor-pointer`}
            >
              🧽
            </button>
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("clear-canvas"))
              }
              className="px-3 py-2 rounded-lg bg-red-100 active:bg-red-200 cursor-pointer"
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
