"use client";

import React, { useRef, useEffect } from "react";

interface CanvasBoardProps {
  tool: "pencil" | "eraser";
}

export default function CanvasBoard({ tool }: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const strokesRef = useRef<any[]>([]); // ← store strokes

  const currentStrokeRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const getPos = (e: any) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: (e.touches ? e.touches[0].clientX : e.clientX) - r.left,
        y: (e.touches ? e.touches[0].clientY : e.clientY) - r.top,
      };
    };

    const start = (e: any) => {
      isDrawingRef.current = true;

      const { x, y } = getPos(e);

      const stroke = {
        tool,
        color: tool === "pencil" ? "#000000" : "#FFFFFF",
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

    const draw = (e: any) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();

      const { x, y } = getPos(e);
      currentStrokeRef.current.points.push({ x, y });

      ctx.strokeStyle = currentStrokeRef.current.color;
      ctx.lineWidth = currentStrokeRef.current.width;
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stop = () => {
      if (!isDrawingRef.current) return;

      isDrawingRef.current = false;
      ctx.beginPath();

      // Store stroke
      strokesRef.current.push(currentStrokeRef.current);
      console.log("Stroke saved:", currentStrokeRef.current);

      currentStrokeRef.current = null;
    };

    // FULL CLEAR HANDLER
    const clear = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      strokesRef.current = [];
      console.log("Canvas cleared");
    };

    window.addEventListener("clear-canvas", clear);

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("mouseleave", stop);

    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stop);

    return () => {
      window.removeEventListener("clear-canvas", clear);
    };
  }, [tool]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full bg-white touch-none"
    />
  );
}
