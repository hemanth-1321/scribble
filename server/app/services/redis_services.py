import json
import redis.asyncio as aioredis
from starlette import status
from fastapi import HTTPException
from app.config import REDIS_URL,MAX_PLAYERS_PER_ROOM
from app.services.schema import add_user

class RoomManager:


    def __init__(self,redis_url:str=REDIS_URL):
        self.redis_url=redis_url
        self.redis=None

    async def init(self):
        """Initialize Redis Connection"""
        self.redis=aioredis.from_url(self.redis_url, decode_responses=True)

    def _room_key(self,room_id:str):
        return f"room:{room_id}:state"

    async def _events_channel(self,room_id:str):
        """create a room with initial state"""
        key=self._room_key(room_id)
        await self.redis.hset(key,mapping={
            "players":json.dumps([]),
            "current_drawer":"",
            "round":1,
            "max_rounds":5,
            "word":""
        })

    async def add_player(self, room_id: str, user: add_user):
        """Add player to room if space available"""
        key = self._room_key(room_id)

        raw = await self.redis.hget(key, "players")
        players = json.loads(raw or "[]")

        if len(players) >= MAX_PLAYERS_PER_ROOM:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Room is full"
            )

        player = user.model_dump()
        players.append(player)

        await self.redis.hset(key, "players", json.dumps(players))

        return {"success": True, "players": players}
    

    async def get_room_state(self,room_id:str):
        """fetch full room state"""
        key=self._room_key(room_id)
        data=await self.redis.hgetall(key)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empty room"
            )
        
        data["players"]=json.loads(data.get("players",[]))
        return data


    async def publish_events(self,room_id:str,event:dict):
        channel=self._events_channel(room_id)
        await self.redis.publish(channel,json.dumps(event))
    

    async def subscribe(self,room_id:str):
        """Subscribe to room events"""
        pubsub=self.redis.pubsub()
        await pubsub.subscribe(self._events_channel(room_id))
        return pubsub