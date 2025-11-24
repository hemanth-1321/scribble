
from fastapi import APIRouter,Body
from app.config.memory import room_service
from app.services.schema import JoinRoomRequest
from pydantic import BaseModel

from uuid import uuid4


router=APIRouter()


class roomBody(BaseModel):
    name:str


@router.post("/createroom")
async def create_room(roombody:roomBody):
    room_id=str(uuid4())[:8]
    return await room_service.create_room(room_id,roombody.name)
   

@router.post("/addplayer")
async def add_player(data:JoinRoomRequest):
    return await room_service.add_player(data.room_id, data.user)

