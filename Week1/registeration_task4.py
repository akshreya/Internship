from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class User(BaseModel):
    username: str
    email: str
    password: str

@app.post("/register")
def register(user: User):
    return {
        "message": "User registered successfully",
        "user": user
    }
