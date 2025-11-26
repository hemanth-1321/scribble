export type Tool = "pencil" | "eraser";

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  tool: Tool;
  color: string;
  width: number;
  points: Point[];
}

export interface Player {
  id: string;
  name: string;
  emoji: string;
  points: number;
  isDrawing?: boolean;
}

export interface DrawStrokeMessage {
  type: "DRAW_STROKE";
  room_id: string;
  player_id: string;
  stroke: Stroke;
}

export interface ClearStrokeMessage {
  type: "CLEAR_STROKE";
  room_id: string;
  player_id: string;
}

export interface ClearCanvasMessage {
  type: "CLEAR_CANVAS";
  room_id: string;
  player_id: string;
}
export interface RoomStateMessage {
  type: "ROOM_STATE";
  state: { strokes: Stroke[]; players: Player[] };
}
export interface ChatMessage {
  type: "CHAT_MESSAGE";
  id: string;
  user_id: string;
  message: string;
  timestamp: number;
}
export type WSMessage =
  | DrawStrokeMessage
  | ClearStrokeMessage
  | RoomStateMessage
  | ClearCanvasMessage
  | ChatMessage;
