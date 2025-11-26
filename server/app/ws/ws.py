import json
import logging
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.config.memory import room_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws/{room_id}/{player_id}")
async def room_connection(websocket: WebSocket, room_id: str, player_id: str):
    await websocket.accept()
    logger.info(f"Player {player_id} connected to room {room_id}")

    if not await room_service.room_exists(room_id):
        await websocket.send_json({"type": "ERROR", "message": "Room does not exist"})
        await websocket.close(code=1000)
        return

    pubsub = await room_service.subscribe(room_id)

    # send initial state
    state = await room_service.get_room_state(room_id)
    try:
        await websocket.send_json({"type": "ROOM_STATE", "state": state})
    except WebSocketDisconnect:
        return

    logger.info(f"Sent initial ROOM_STATE to {player_id}")

    async def redis_listener():
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    logger.info("event event",data)
                    await websocket.send_json(data)
        except WebSocketDisconnect:
            logger.info(f"[redis_listener] {player_id} disconnected")
        except Exception as e:
            logger.error(f"[redis_listener] error: {e}")

    async def ws_listener():
        try:
            while True:
                data = await websocket.receive_json()
                event_type = data.get("type")

                if event_type == "DRAW_STROKE":
                    await room_service.add_stroke(room_id, data["stroke"])
                elif event_type == "CLEAR_STROKE":
                    await room_service.clear_strokes(room_id)
                elif event_type=="CLEAR_CANVAS":
                    await room_service.clear_canvas(room_id)

                if event_type in ["DRAW_STROKE", "CLEAR_STROKE","CLEAR_CANVAS","GUESS", "START_GAME"]:
                    await room_service.publish_events(room_id, data)

        except WebSocketDisconnect:
            logger.info(f"[ws_listener] {player_id} disconnected")

    try:
        await asyncio.gather(redis_listener(), ws_listener())
    except Exception as e:
        logger.error(f"[gather] error: {e}")
    finally:
        await pubsub.unsubscribe(room_service._events_channel(room_id))
        logger.info(f"Cleaned up for {player_id}")
