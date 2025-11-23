from fastapi import APIRouter,WebSocket,WebSocketDisconnect
from app.config.memory import room_service



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
