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

export interface DrawStrokeMessage {
  type: "DRAW_STROKE";
  room_id: string;
  player_id: string;
  stroke: Stroke;
}

export interface ClearCanvasMessage {
  type: "CLEAR_CANVAS";
  room_id: string;
  player_id: string;
}

export interface RoomStateMessage {
  type: "ROOM_STATE";
  state: { strokes: Stroke[] };
}

export type WSMessage =
  | DrawStrokeMessage
  | ClearCanvasMessage
  | RoomStateMessage;
