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
        logger.info(f"Sent initial ROOM_STATE to {player_id}")
    except Exception as e:
        logger.error(f"Failed to send initial state: {e}")
        await pubsub.unsubscribe(room_service._events_channel(room_id))
        return

    async def redis_listener():
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    logger.info(f"Redis event: {data}")
                    try:
                        await websocket.send_json(data)
                    except Exception as e:
                        logger.error(f"[redis_listener] send error: {e}")
                        break
        except asyncio.CancelledError:
            logger.info(f"[redis_listener] {player_id} cancelled")
            raise  # Re-raise to properly handle cancellation
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
                elif event_type == "CLEAR_CANVAS":
                    await room_service.clear_canvas(room_id)
                elif event_type == "CHAT_MESSAGE":
                    await room_service.add_chat(room_id, player_id, data["message"])

                if event_type in ["DRAW_STROKE", "CLEAR_STROKE", "CLEAR_CANVAS", "GUESS", "START_GAME"]:
                    await room_service.publish_events(room_id, data)

        except asyncio.CancelledError:
            logger.info(f"[ws_listener] {player_id} cancelled")
            raise  # Re-raise to properly handle cancellation
        except WebSocketDisconnect:
            logger.info(f"[ws_listener] {player_id} disconnected")
        except Exception as e:
            logger.error(f"[ws_listener] error: {e}")

    redis_task = None
    ws_task = None
    
    try:
        # Create tasks so we can cancel them later
        redis_task = asyncio.create_task(redis_listener())
        ws_task = asyncio.create_task(ws_listener())
        
        # Wait for either task to complete (usually due to disconnect)
        done, pending = await asyncio.wait(
            [redis_task, ws_task],
            return_when=asyncio.FIRST_COMPLETED
        )
        
        # Cancel remaining tasks
        for task in pending:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
                
    except Exception as e:
        logger.error(f"[gather] error: {e}")
    finally:
        # Cleanup
        if redis_task and not redis_task.done():
            redis_task.cancel()
            try:
                await redis_task
            except asyncio.CancelledError:
                pass
                
        if ws_task and not ws_task.done():
            ws_task.cancel()
            try:
                await ws_task
            except asyncio.CancelledError:
                pass
        
        try:
            await pubsub.unsubscribe(room_service._events_channel(room_id))
        except Exception as e:
            logger.error(f"Error unsubscribing: {e}")
            
        try:
            await websocket.close()
        except Exception:
            pass
            
        logger.info(f"Cleaned up for {player_id}")