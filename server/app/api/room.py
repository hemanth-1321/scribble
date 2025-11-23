
from fastapi import APIRouter
from app.config.memory import room_service
from app.services.schema import JoinRoomRequest
from uuid import uuid4


router=APIRouter()



@router.post("/createroom")
async def create_room():
    room_id=str(uuid4())[:8]
    return await room_service.create_room(room_id)
   

@router.post("/addplayer")
async def add_player(data:JoinRoomRequest):
    return await room_service.add_player(data.room_id, data.user)

