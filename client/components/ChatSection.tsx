"use client";

import React, { useState } from "react";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
}

interface Props {
  messages: ChatMessage[];
  onSend: (msg: string) => void;
}

export default function ChatSection({ messages, onSend }: Props) {
  const [value, setValue] = useState("");

  const send = () => {
    if (!value.trim()) return;
    onSend(value);
    setValue("");
  };

  return (
    <div className="w-72 bg-white rounded-2xl shadow-sm border flex flex-col shrink-0">
      <div className="p-4 border-b">
        <h3 className="font-bold text-gray-700">Chat</h3>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="p-2 bg-gray-100 rounded-lg">
            <p className="font-bold text-xs">{m.sender}</p>
            <p className="text-sm">{m.text}</p>
          </div>
        ))}
      </div>

      <div className="p-3 border-t flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-1 text-sm"
          placeholder="Type..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
