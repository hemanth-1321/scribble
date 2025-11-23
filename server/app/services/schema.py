from pydantic import BaseModel


class add_user(BaseModel):
    id:str
    name:str
    score:int=0


class JoinRoomRequest(BaseModel):
    room_id: str
    user: add_user