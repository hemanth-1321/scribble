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

    # Check if room exists
    if not await room_service.room_exists(room_id):
        await websocket.send_json({"type": "ERROR", "message": "Room does not exist"})
        await websocket.close(code=1000)
        logger.warning(f"Player {player_id} tried to join non-existent room {room_id}")
        return

    # Subscribe to Redis pub/sub channel for this room
    pubsub = await room_service.subscribe(room_id)

    # Send current ROOM_STATE to the joining player
    state = await room_service.get_room_state(room_id)
    await websocket.send_json({"type": "ROOM_STATE", "state": state})
    logger.info(f"Sent initial ROOM_STATE to {player_id}")

    async def redis_listener():
        """Listen to Redis channel and forward events to this WebSocket"""
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                await websocket.send_json(data)
                logger.debug(f"Sent to {player_id}: {data}")

    async def ws_listener():
        """Listen to WebSocket messages and broadcast to room"""
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type")
            logger.info(
                    f"Received DRAW_STROKE from {player_id}: "
                    f"tool={data['stroke']['tool']}, "
                    f"color={data['stroke']['color']}, "
                    f"points={len(data['stroke']['points'])}"
                )


            if event_type == "DRAW_STROKE":
                await room_service.add_stroke(room_id, data["stroke"])
            elif event_type == "CLEAR_CANVAS":
                await room_service.clear_strokes(room_id)

            # Broadcast to all players via Redis
            if event_type in ["DRAW_STROKE", "CLEAR_CANVAS", "GUESS", "START_GAME"]:
                await room_service.publish_events(room_id, data)
                logger.debug(f"Published {event_type} from {player_id}")

    try:
        await asyncio.gather(redis_listener(), ws_listener())
    except WebSocketDisconnect:
        logger.info(f"Player {player_id} disconnected from room {room_id}")
        await pubsub.unsubscribe(room_service._events_channel(room_id))
