import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.api.room import router as room_router
from app.config.memory import room_service
from app.config.logger import configure_logging
from app.ws.ws import router as ws

configure_logging("INFO")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    await room_service.init()
    logger.info("Redis initialized")
    yield
    # --- Shutdown ---
    if room_service.redis:
        await room_service.redis.close()
        logger.info("Redis connection closed")

app = FastAPI(lifespan=lifespan)

app.include_router(room_router, prefix="/api/room", tags=["rooms"])
app.include_router(ws, prefix="") 


@app.get("/")
def health():
    return {"message": "hello world"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
