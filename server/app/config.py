import os

REDIS_URL=os.getenv("REDIS_URL","redis://localhost:6379/0")
KAFKA_BROKER=os.getenv("KAFKA_BROKER","localhost:9092")
KAFKA_TOPIC="scribble.events"
MAX_PLAYERS_PER_ROOM=5
MAX_ROUNDS=5