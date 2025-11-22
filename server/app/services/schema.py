from pydantic import BaseModel


class add_user(BaseModel):
    id:set
    name:str
    score:int=0