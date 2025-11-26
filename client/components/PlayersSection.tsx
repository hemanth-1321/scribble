"use client";

import { useState, useCallback, useMemo } from "react";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { WSMessage } from "@/lib/types";

interface Player {
  id: string;
  name: string;
  points: number;
  emoji: string;
  isDrawing?: boolean;
}

interface PlayersSectionProps {
  roomId: string;
  playerId: string;
  className?: string;
}

export default function PlayersSection({
  roomId,
  playerId,
  className = "",
}: PlayersSectionProps) {
  const [players, setPlayers] = useState<Player[]>([]);

  const handleMessage = useCallback((msg: WSMessage) => {
    if (msg.type === "ROOM_STATE" && msg.state.players) {
      setPlayers(msg.state.players);
    }
  }, []);

  const socketConfig = useMemo(
    () => ({ roomId, playerId, onMessage: handleMessage }),
    [roomId, playerId, handleMessage]
  );

  useRoomSocket(socketConfig);

  return (
    <div
      className={`bg-white md:rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden ${className}`}
    >
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Players</h3>
        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
          {players.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {players.map((p) => {
          const isMe = p.id === playerId;
          return (
            <div
              key={p.id}
              className={`group flex items-center justify-between p-2 rounded-xl transition-all ${
                p.isDrawing
                  ? "bg-indigo-50 border border-indigo-200 shadow-sm"
                  : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                    p.isDrawing ? "bg-white" : "bg-gray-100"
                  }`}
                >
                  {p.emoji}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-700 truncate">
                    {p.name}{" "}
                    {isMe && (
                      <span className="text-gray-400 font-normal">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    {p.points} pts
                  </p>
                </div>
              </div>

              {p.isDrawing && (
                <div
                  className="text-indigo-600 animate-bounce text-lg mr-1"
                  title="Drawing now"
                >
                  ✏️
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
