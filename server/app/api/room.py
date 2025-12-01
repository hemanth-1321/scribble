
from fastapi import APIRouter,Body
from app.config.memory import room_service
from app.services.schema import JoinRoomRequest,GuessRequest
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

@router.post("/{id}/start")
async def start_game(id:str):
    return await room_service.start_game(room_id=id)


@router.post("/guess")
async def guess_word(req:GuessRequest):
    return await room_service.guess_word(req.room_id,req.player_id,req.guess)
