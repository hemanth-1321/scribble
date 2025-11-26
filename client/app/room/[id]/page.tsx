"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import CanvasBoard from "@/components/CanvasBoard";
import PlayersSection from "@/components/PlayersSection";
import ChatSection from "@/components/ChatSection";
import { Tool } from "@/lib/types";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  timestamp: number;
}

interface Player {
  id: string;
  name: string;
  score: number;
}

export default function Page({ params }: PageProps) {
  const [tool, setTool] = useState<Tool>("pencil");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loadingPlayer, setLoadingPlayer] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Mobile UI States
  const [showPlayers, setShowPlayers] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const { id } = React.use(params);
  const roomId = id;

  // Initialize player and WebSocket connection
  useEffect(() => {
    const storedPlayerId = localStorage.getItem("playerId");

    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
      connectWebSocket(storedPlayerId);
    } else {
      toast.error("Player ID not found in localStorage");
      setPlayerId(null);
    }

    setLoadingPlayer(false);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId]);

  const connectWebSocket = (pId: string) => {
    const wsUrl = `${
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"
    }/ws/${roomId}/${pId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      toast.success("Connected to room");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast.error("Connection error");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      toast.info("Disconnected from room");
    };

    wsRef.current = ws;
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case "ROOM_STATE":
        // Update initial state
        if (data.state.players) {
          setPlayers(data.state.players);
        }
        if (data.state.chat) {
          setMessages(data.state.chat);
        }
        break;

      case "CHAT_MESSAGE":
        // Add new chat message
        setMessages((prev) => [...prev, data.message]);
        break;

      case "PLAYER_JOINED":
      case "PLAYER_LEFT":
        // Update players list
        if (data.players) {
          setPlayers(data.players);
        }
        break;

      default:
        // Handle other message types (drawing, game state, etc.)
        break;
    }
  };

  const sendChatMessage = (message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error("Not connected to room");
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "CHAT_MESSAGE",
        message: message,
      })
    );
  };

  if (loadingPlayer) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-400 font-medium">Loading game...</span>
        </div>
      </div>
    );
  }

  if (!playerId) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500 bg-gray-50 px-4 text-center">
        Player ID not found. Please reload the page or login again.
      </div>
    );
  }

  return (
    <div className="h-dvh bg-gray-100 flex flex-col md:flex-row md:p-4 gap-4 overflow-hidden relative">
      {/* --- Mobile Header --- */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0 z-20">
        <button
          onClick={() => {
            setShowPlayers(!showPlayers);
            setShowChat(false);
          }}
          className={`p-2 rounded-lg transition-colors ${
            showPlayers
              ? "bg-indigo-100 text-indigo-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </button>

        <h1 className="font-bold text-gray-800 text-sm">
          Room: {roomId.slice(0, 6)}...
        </h1>

        <button
          onClick={() => {
            setShowChat(!showChat);
            setShowPlayers(false);
          }}
          className={`p-2 rounded-lg transition-colors relative ${
            showChat
              ? "bg-indigo-100 text-indigo-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {messages.length > 9 ? "9+" : messages.length}
            </span>
          )}
        </button>
      </div>

      {/* --- Players Section (Desktop: Static Left | Mobile: Overlay Left) --- */}
      <div
        className={`
        fixed md:relative inset-y-0 left-0 z-30
        w-3/4 md:w-64 bg-white md:bg-transparent shadow-2xl md:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${showPlayers ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        md:flex md:flex-col shrink-0 h-full
        ${showPlayers ? "block" : "hidden md:flex"}
      `}
      >
        {/* Mobile Close Button */}
        <div
          className="md:hidden absolute top-2 right-2 p-2 cursor-pointer z-10"
          onClick={() => setShowPlayers(false)}
        >
          <span className="text-gray-400 text-2xl">&times;</span>
        </div>
        <PlayersSection
          roomId={roomId}
          playerId={playerId}
          className="h-full border-r md:border-r-0 rounded-none md:rounded-2xl"
        />
      </div>

      {/* --- Overlay Backdrop for Mobile --- */}
      {(showPlayers || showChat) && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
          onClick={() => {
            setShowPlayers(false);
            setShowChat(false);
          }}
        />
      )}

      {/* --- Main Canvas Area --- */}
      <div className="flex-1 relative flex flex-col md:rounded-2xl md:border md:shadow-sm overflow-hidden bg-white z-10">
        <CanvasBoard tool={tool} roomId={roomId} playerId={playerId} />

        {/* Floating Toolbar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-40 w-full flex justify-center px-4">
          <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md shadow-lg border border-gray-200/50 p-1.5 rounded-2xl pointer-events-auto scale-100 transition-transform">
            <button
              onClick={() => setTool("pencil")}
              className={`p-3 rounded-xl transition-all duration-200 group relative ${
                tool === "pencil"
                  ? "bg-indigo-100 text-indigo-700 shadow-inner"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
              title="Pencil"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
              </svg>
            </button>

            <button
              onClick={() => setTool("eraser")}
              className={`p-3 rounded-xl transition-all duration-200 group ${
                tool === "eraser"
                  ? "bg-indigo-100 text-indigo-700 shadow-inner"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
              title="Eraser"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path
                  fillRule="evenodd"
                  d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314c.99-.55 2.253-.14 2.797.863l1.838 3.398c.55.99.14 2.253-.863 2.797L8.356 19.34a2.25 2.25 0 01-2.11.082l-3.8-1.52a2.25 2.25 0 01-1.284-2.455l1.056-6.432c.214-1.304 1.636-1.996 2.826-1.378l2.173 1.17z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <div className="w-px h-8 bg-gray-200 mx-1"></div>

            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("clear-canvas"))
              }
              className="p-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Clear Board"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path
                  fillRule="evenodd"
                  d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`
        fixed md:relative inset-y-0 right-0 z-30
        w-3/4 md:w-80 bg-white md:bg-transparent shadow-2xl md:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${showChat ? "translate-x-0" : "translate-x-full md:translate-x-0"}
        md:flex md:flex-col shrink-0 h-full
        ${showChat ? "block" : "hidden md:flex"}
      `}
      >
        {/* Mobile Close Button */}
        <div
          className="md:hidden absolute top-2 left-2 p-2 cursor-pointer z-10"
          onClick={() => setShowChat(false)}
        >
          <span className="text-gray-400 text-2xl">&times;</span>
        </div>
        <ChatSection
          messages={messages}
          onSend={sendChatMessage}
          playerId={playerId}
          players={players}
          className="h-full border-l md:border-l-0 rounded-none md:rounded-2xl"
        />
      </div>
    </div>
  );
}
