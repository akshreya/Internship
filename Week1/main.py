from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message":"Hello"}

@app.get("/student/{id}")
def student(id:int):
    return {"student_id":id}
