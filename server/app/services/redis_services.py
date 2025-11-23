import json
import logging
import redis.asyncio as aioredis
from starlette import status
from fastapi import HTTPException
from app.config.settings import Config
from app.services.schema import add_user

logger = logging.getLogger(__name__)

class GlobalMemory:

    def __init__(self, redis_url: str = Config.REDIS_URL):
        self.redis_url = redis_url
        self.redis = None

    async def init(self):
        """Initialize Redis connection"""
        self.redis = aioredis.from_url(self.redis_url, decode_responses=True)


    def _room_key(self, room_id: str) -> str:
        return f"room:{room_id}:state"

    def _events_channel(self, room_id: str) -> str:
        return f"room:{room_id}:events"

 
    async def create_room(self, room_id: str):
        """Create a room with initial state"""
        try:
            key = self._room_key(room_id)

            await self.redis.hset(key, mapping={
                "players": json.dumps([]),
                "current_drawer": "",
                "round": "1",
                "max_rounds": "5",
                "word": ""
            })
            logger.info(f"Room created: {room_id}")
            return {"success": True, "room_id": room_id}
        except Exception as e:
            logger.info(f"Room creation failed:{e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="failed to create room"
            )
        

    async def add_player(self, room_id: str, user: add_user):
        try:
            key = self._room_key(room_id)

            raw = await self.redis.hget(key, "players")
            players = json.loads(raw or "[]")

            if len(players) >= Config.MAX_PLAYERS_PER_ROOM:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Room is full"
                )

            player = user.model_dump()  # FIXED
            players.append(player)

            await self.redis.hset(key, "players", json.dumps(players))
            logger.info(f"Player '{user.id}' joined room {room_id}. Total players: {len(players)}")

            return {"success": True, "players": players}
        except Exception as e:
            logger.info(f"could not add player:{e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="could not add player"
            )

        


    async def get_room_state(self, room_id: str):
        key = self._room_key(room_id)
        data = await self.redis.hgetall(key)

        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room does not exist"
            )

        data["players"] = json.loads(data.get("players", "[]"))

        return data


    async def publish_events(self, room_id: str, event: dict):
        channel = self._events_channel(room_id)
        logger.info(f"published to channel {channel}")
        await self.redis.publish(channel, json.dumps(event))

    async def subscribe(self, room_id: str):
        pubsub = self.redis.pubsub()

        await pubsub.subscribe(self._events_channel(room_id))
        return pubsub

