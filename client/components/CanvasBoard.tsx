"use client";

import { useRef, useEffect } from "react";
import {
  Tool,
  Stroke,
  Point,
  DrawStrokeMessage,
  ClearCanvasMessage,
  WSMessage,
} from "@/lib/types";
import { useRoomSocket } from "@/hooks/useRoomSocket";

interface CanvasBoardProps {
  tool: Tool;
  roomId: string;
  playerId: string;
}

export default function CanvasBoard({
  tool,
  roomId,
  playerId,
}: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);

  const { sendMessage } = useRoomSocket({
    roomId,
    playerId,
    onMessage: (msg: WSMessage) => {
      switch (msg.type) {
        case "DRAW_STROKE":
          if (msg.player_id !== playerId) {
            strokesRef.current = strokesRef.current ?? [];
            strokesRef.current.push(msg.stroke);
            redrawAll();
          }
          break;

        case "CLEAR_CANVAS":
          clearCanvas();
          break;

        case "ROOM_STATE":
          strokesRef.current = msg.state.strokes ?? [];
          redrawAll();
          break;
      }
    },
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }, []);

  const getPos = (e: MouseEvent | TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = (e as TouchEvent).touches
      ? (e as TouchEvent).touches[0].clientX
      : (e as MouseEvent).clientX;
    const clientY = (e as TouchEvent).touches
      ? (e as TouchEvent).touches[0].clientY
      : (e as MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const redrawAll = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokesRef.current ?? []) {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      stroke.points.forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
      );
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current = [];
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const start = (e: MouseEvent | TouchEvent) => {
      isDrawingRef.current = true;
      const { x, y } = getPos(e);

      const stroke: Stroke = {
        tool,
        color: tool === "eraser" ? "#FFFFFF" : "#000000",
        width: tool === "eraser" ? 20 : 3,
        points: [{ x, y }],
      };

      currentStrokeRef.current = stroke;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current || !currentStrokeRef.current) return;
      e.preventDefault();

      const { x, y } = getPos(e);
      currentStrokeRef.current.points.push({ x, y });

      ctx.strokeStyle = currentStrokeRef.current.color;
      ctx.lineWidth = currentStrokeRef.current.width;
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stop = () => {
      if (!isDrawingRef.current || !currentStrokeRef.current) return;
      isDrawingRef.current = false;

      strokesRef.current = strokesRef.current ?? [];
      strokesRef.current.push(currentStrokeRef.current);

      const msg: DrawStrokeMessage = {
        type: "DRAW_STROKE",
        room_id: roomId,
        player_id: playerId,
        stroke: currentStrokeRef.current,
      };

      sendMessage(msg);
      currentStrokeRef.current = null;
      ctx.beginPath();
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("mouseleave", stop);
    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stop);

    // Global clear-canvas event
    const handleClear = () => {
      clearCanvas();
      const msg: ClearCanvasMessage = {
        type: "CLEAR_CANVAS",
        room_id: roomId,
        player_id: playerId,
      };
      sendMessage(msg);
    };
    window.addEventListener("clear-canvas", handleClear);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stop);
      canvas.removeEventListener("mouseleave", stop);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stop);
      window.removeEventListener("clear-canvas", handleClear);
    };
  }, [tool, roomId, playerId, sendMessage]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full bg-white touch-none cursor-pointer"
    />
  );
}
