from fastapi import APIRouter
from uuid import uuid4

router=APIRouter()

@router.post("/create-room")
async def create_room():
    room_id=str(uuid4())[:8]
    return {
        "room_id":room_id,
        "link": f"/room/{room_id}"
    }
