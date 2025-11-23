import json
import logging
import asyncio
from fastapi import APIRouter,WebSocket,WebSocketDisconnect
from app.config.memory import room_service


logger = logging.getLogger(__name__)


router=APIRouter()


@router.websocket("/ws/{room_id}/{player_id}")
async def room_connection(websocket: WebSocket, room_id: str, player_id: str):
    await websocket.accept()
    logger.info(f"Player {player_id} connected to room {room_id}")

    pubsub = await room_service.subscribe(room_id)

    state = await room_service.get_room_state(room_id)
    await websocket.send_json({"type": "ROOM_STATE", "state": state})
    logger.info(f"Sent initial ROOM_STATE to {player_id}")

    try:
        async def redis_listener():
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    await websocket.send_json(data)
                    logger.info(f"Sent to {player_id}: {data}")

        async def ws_listener():
            while True:
                data = await websocket.receive_json()
                logger.info(f"Received from {player_id}: {data}")
                event_type = data.get("type")

                if event_type == "DRAW_POINT":
                    await room_service.publish_events(room_id, data)
                    logger.info(f"Published DRAW_POINT event from {player_id} to room {room_id}")

                elif event_type == "START_GAME":
                    drawer_id = data.get("drawer_id")
                    word_length = data.get("word_length", 5)
                    start_event = {
                        "type": "START_GAME",
                        "drawer_id": drawer_id,
                        "word_length": word_length
                    }
                    await room_service.publish_events(room_id, start_event)
                    logger.info(f"Published START_GAME event in room {room_id}")

                elif event_type == "GUESS":
                    await room_service.publish_events(room_id, data)
                    logger.info(f"Published GUESS from {player_id} in room {room_id}")

        await asyncio.gather(redis_listener(), ws_listener())

    except WebSocketDisconnect:
        logger.info(f"Player {player_id} disconnected from room {room_id}")