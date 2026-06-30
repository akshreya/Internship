from fastapi import FastAPI
from schemas import Login

app = FastAPI()

@app.post("/login")
def login(user: Login):

    if user.email == "admin@gmail.com" and user.password == "admin123":
        return {"message": "Login successful"}

    return {"message": "Invalid credentials"}
