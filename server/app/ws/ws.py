import json
import logging
import asyncio
from fastapi import APIRouter,WebSocket,WebSocketDisconnect
from app.config.memory import room_service


logger = logging.getLogger(__name__)


router=APIRouter()

@router.websocket("/ws/{room_id}/{player_id}")
async def room_connection(websocket:WebSocket,room_id:str,player_id:str):
    await websocket.accept()

    pubsub=await room_service.subscribe(room_id)

    state=await room_service.get_room_state(room_id)
    await websocket.send_json({
        "type":"ROOM_STATE",
        "state":state
    })
    
    try:
        async def redis_listener():
            async for message in pubsub.listen():
                if message["type"]=="message":
                    data=json.loads(message["data"])
                    await websocket.send_json(data)

        async def ws_listner():
            while True:
                data=await websocket.receive_json()
                event_type=data.get("type")

                if event_type =="DRAW_POINT":
                    await room_service.publish_events(room_id,data)

                elif event_type=="START_GAME":
                    drawer_id=data.get("drawer_id")
                    word_length=data.get("word_length",5)
                    start_event={"type":"START_GAME","drawer_id":drawer_id,"word_length":word_length}
                    await room_service.publish_events(room_id,start_event)
                
                elif event_type=="GUESS":
                    await room_service.publish_events(room_id,data)
        await asyncio.gather(redis_listener(),ws_listner())
    except WebSocketDisconnect:
        logger.info(f"{player_id} disconnected from room {room_id}")