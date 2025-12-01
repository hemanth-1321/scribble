import json
import random
import uuid
import logging
import redis.asyncio as aioredis
from fastapi import HTTPException
from starlette import status
from uuid import uuid4
from app.config.settings import Config
from app.services.schema import add_user
from app.config.words import WORDS
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

    async def room_exists(self, room_id: str) -> bool:
        """Check if a room exists"""
        key = self._room_key(room_id)
        exists = await self.redis.exists(key)
        return exists > 0

    async def create_room(self, room_id: str, name: str):
        key = self._room_key(room_id)
        creator_player = {
            "id": str(uuid4())[:8],
            "name": name,
            "score": 0
        }
        await self.redis.hset(key, mapping={
            "players": json.dumps([creator_player]),
            "current_drawer": "",
            "round": "0",
            "max_rounds": str(Config.MAX_ROUNDS if hasattr(Config, "MAX_ROUNDS") else 5),
            "word": "",
            "strokes":json.dumps([]),
            "started":0
            })
        logger.info(f"Room created: {room_id} by {creator_player}")
        return {"success": True, "room_id": room_id, "player": creator_player}

    
    async def add_player(self, room_id: str, user: add_user):
        key = self._room_key(room_id)
        raw = await self.redis.hget(key, "players")
        players = json.loads(raw or "[]")

        if len(players) >= Config.MAX_PLAYERS_PER_ROOM:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Room is full")
        player_id=str(uuid.uuid4())[:8]
        player = {
            "id":player_id,
            "name":user.name,
            "score":user.score
        }
        players.append(player)
        await self.redis.hset(key, "players", json.dumps(players))
        logger.info(f"Player '{user.name}' joined room {room_id}. Total players: {len(players)}")
        state=await self.get_room_state(room_id)
        await self.publish_events(room_id,{
            "type":"ROOM_STATE",
            "state":state
        })
        return {"success": True, "players": players}

    async def remove_player(self,room_id:str,player_id:str):
        key=self._room_key(room_id)
        raw=await self.redis.hget(key,"players")
        players=json.loads(raw or "[]")
        players=[p for p in players if p["id"]!=player_id]

        await self.redis.hset(key,"players",json.dumps(players))
        return {"success":True,"players":players}

    async def add_stroke(self, room_id: str, stroke: dict):
        """Add a stroke to the room state"""
        key = self._room_key(room_id)
        data = await self.redis.hgetall(key)
        if not data:
            raise HTTPException(status_code=404, detail="Room not found")

        strokes = json.loads(data.get("strokes", "[]"))
        strokes.append(stroke)
        await self.redis.hset(key, "strokes", json.dumps(strokes))
        logger.info(f"Added stroke in room {room_id}. Total strokes: {len(strokes)}")

    async def clear_strokes(self, room_id: str):
        """Clear all strokes in a room"""
        key = self._room_key(room_id)
        await self.redis.hset(key, "strokes", json.dumps([]))
        logger.info(f"Cleared strokes in room {room_id}")
    
    async def clear_canvas(self,room_id:str):
        """clear full canvas"""
        key=self._room_key(room_id)
        await self.redis.hset(key,"strokes","[]")
        logger.info(f"Canvas cleared in room {room_id}")
        return {"sucess":True}



    async def get_room_state(self, room_id: str):
        key = self._room_key(room_id)
        data = await self.redis.hgetall(key)
        if not data:
            return None

        data["players"] = json.loads(data.get("players", "[]"))
        data["strokes"] = json.loads(data.get("strokes", "[]"))  
        data["chat"]=json.loads(data.get("chat","[]"))
        return data

    async def add_chat(self, room_id: str, user_id: str, message: str):
        key = self._room_key(room_id)
        data = await self.redis.hgetall(key)
        if not data:
            raise HTTPException(status_code=404, detail="Room not found")

        chats = json.loads(data.get("chat", "[]"))
        chat_message = {
            "id": str(uuid4())[:8],
            "user_id": user_id,
            "message": message,
            "timestamp": int(__import__("time").time())
        }
        chats.append(chat_message)
        await self.redis.hset(key, "chat", json.dumps(chats))

        players = json.loads(data.get("players", "[]"))

        await self.publish_events(room_id, {
            "type": "CHAT_MESSAGE",
            "message": chat_message,
            "players": players 
        })

        logger.info(f"Chat message in room {room_id} from {user_id}: {message}")
        return chat_message
    
    async def start_game(self,room_id:str):
        key=self._room_key(room_id)
        data=await self.redis.hgetall(key)
        
        if not data:
             raise HTTPException(
                 status_code=status.HTTP_404_NOT_FOUND,
                 detail="room is empty"
             )
        players=json.loads(data.get("players",'[]'))
        if len(players)<2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Need at least 2 players in the room"
            )        
        
        drawer=random.choice(players)
        logger.info(f"player {drawer} is the drawer")
        word=random.choice(WORDS)
        logger.info(f"{word} is the word")
        
        await self.redis.hset(key,mapping={
            "drawer":drawer["id"],
            "word":word,
            "started":1,
            "guessed":json.dumps([])
        })
        
        await self.publish_events(room_id,{
            "type":"GAME_STARTED",
            "drawer":drawer,
            "word":word
        })
        return{
             "type":"GAME_STARTED",
              "drawer":drawer,
              "word":word
        }
    
    async def guess_word(self,room_id:str,player_id:str,guess:str):
        key=self._room_key(room_id)
        data=await self.redis.hgetall(key)
        word=data.get("word")
        if guess.lower()==word.lower():
            await self.publish_events(room_id,{
                "type":"GAME_ENDED",
                "winner":player_id,
                "correct_word":word
            })
            await self.redis.delete(key)
            return {
                "correct":True
            }
        return {
            "correct":False
        }
                
    
    async def publish_events(self, room_id: str, event: dict):
        channel = self._events_channel(room_id)
        await self.redis.publish(channel, json.dumps(event))
        logger.info(f"Published event to channel {channel}: {event}")

    async def subscribe(self, room_id: str):
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(self._events_channel(room_id))
        return pubsub
