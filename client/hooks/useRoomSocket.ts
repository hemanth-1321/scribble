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

  // Store callbacks in refs so they don't trigger reconnections
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
  }, [onMessage, onOpen, onClose, onError]);

  useEffect(() => {
    isCleaningUpRef.current = false;

    const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}/${playerId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      if (isCleaningUpRef.current) return;
      console.log(
        `[WebSocket] Connected to room ${roomId} as player ${playerId}`
      );
      onOpenRef.current?.();
    };

    ws.onclose = () => {
      if (isCleaningUpRef.current) return;
      console.log(`[WebSocket] Disconnected from room ${roomId}`);
      onCloseRef.current?.();
    };

    ws.onerror = (err) => {
      if (isCleaningUpRef.current) return;
      console.error(`[WebSocket] Error:`, err);
      onErrorRef.current?.(err);
    };

    ws.onmessage = (event) => {
      if (isCleaningUpRef.current) return;
      const data: WSMessage = JSON.parse(event.data);
      onMessageRef.current?.(data);
    };

    return () => {
      isCleaningUpRef.current = true;
      console.log(`[WebSocket] Closing connection to room ${roomId}`);
      ws.close();
    };
  }, [roomId, playerId]); // Only reconnect when roomId or playerId changes

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
