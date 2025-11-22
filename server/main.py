from fastapi import FastAPI, Request
from app.api.room import router as room_router
app=FastAPI()


app.include_router(room_router,prefix="/api/room",tags=["rooms"])

@app.get("/")
def health():
    return{
        "messgae":"hello world"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
