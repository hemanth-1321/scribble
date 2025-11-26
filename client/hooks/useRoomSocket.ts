"use client";

import { WSMessage } from "@/lib/types";
import { useCallback, useEffect, useRef } from "react";

interface UseRoomSocketProps {
  roomId: string;
  playerId: string;
  onMessage?: (data: WSMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
}

export function useRoomSocket({
  roomId,
  playerId,
  onMessage,
  onOpen,
  onClose,
  onError,
}: UseRoomSocketProps) {
  const socketRef = useRef<WebSocket | null>(null);
  const isCleaningUpRef = useRef(false);

  useEffect(() => {
    isCleaningUpRef.current = false;

    const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}/${playerId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      if (isCleaningUpRef.current) return;
      console.log(
        `[WebSocket] Connected to room ${roomId} as player ${playerId}`
      );
      onOpen?.();
    };

    ws.onclose = () => {
      if (isCleaningUpRef.current) return;
      console.log(`[WebSocket] Disconnected from room ${roomId}`);
      onClose?.();
    };

    ws.onerror = (err) => {
      if (isCleaningUpRef.current) return;
      console.error(`[WebSocket] Error:`, err);
      onError?.(err);
    };

    ws.onmessage = (event) => {
      if (isCleaningUpRef.current) return;
      const data: WSMessage = JSON.parse(event.data);
      onMessage?.(data);
    };

    return () => {
      isCleaningUpRef.current = true;
      console.log(`[WebSocket] Closing connection to room ${roomId}`);
      ws.close();
    };
  }, [roomId, playerId, onMessage, onOpen, onClose, onError]);

  const sendMessage = useCallback((data: WSMessage) => {
    if (
      socketRef.current?.readyState === WebSocket.OPEN &&
      !isCleaningUpRef.current
    ) {
      socketRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { socketRef, sendMessage };
}
