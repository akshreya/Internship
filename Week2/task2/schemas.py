from pydantic import BaseModel

class EmployeeCreate(BaseModel):
    name: str
    email: str
    department_id: int
