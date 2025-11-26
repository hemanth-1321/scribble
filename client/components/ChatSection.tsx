"use client";

import React, { useState, useEffect, useRef } from "react";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
}

interface Props {
  messages: ChatMessage[];
  onSend: (msg: string) => void;
  className?: string; // Added for external styling control
}

export default function ChatSection({
  messages,
  onSend,
  className = "",
}: Props) {
  const [value, setValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    if (!value.trim()) return;
    onSend(value);
    setValue("");
  };

  return (
    <div
      className={`bg-white md:rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden ${className}`}
    >
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span>💬</span> Chat
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-3 bg-white"
      >
        {messages.map((m) => {
          const isMe = m.sender === "You";
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <span
                className={`text-[10px] mb-1 font-medium text-gray-400 ${
                  isMe ? "mr-1" : "ml-1"
                }`}
              >
                {m.sender}
              </span>
              <div
                className={`px-4 py-2 max-w-[85%] text-sm rounded-2xl break-words ${
                  isMe
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            placeholder="Type a message..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button
            onClick={send}
            disabled={!value.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10 shrink-0 shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 translate-x-[1px] -translate-y-[1px]"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
