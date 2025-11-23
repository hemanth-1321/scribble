from pydantic_settings import BaseSettings ,SettingsConfigDict


class Settings(BaseSettings):
    REDIS_URL:str
    KAFKA_BROKER:str
    KAFKA_TOPIC:str
    MAX_PLAYERS_PER_ROOM:int
    MAX_ROUNDS:int
    model_config=SettingsConfigDict(
        env_file=".env", 
        extra="ignore"
    )


Config=Settings()