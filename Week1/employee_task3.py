from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

employees = []

class Employee(BaseModel):
    id: int
    name: str
    department: str
    salary: float


@app.post("/employee")
def add_employee(employee: Employee):
    employees.append(employee)
    return {"message": "Employee added successfully"}


@app.get("/employee")
def get_employees():
    return employees


@app.get("/employee/{emp_id}")
def get_employee(emp_id: int):
    for employee in employees:
        if employee.id == emp_id:
            return employee
    return {"error": "Employee not found"}


@app.put("/employee/{emp_id}")
def update_employee(emp_id: int, updated_employee: Employee):
    for i in range(len(employees)):
        if employees[i].id == emp_id:
            employees[i] = updated_employee
            return {"message": "Employee updated successfully"}
    return {"error": "Employee not found"}


@app.delete("/employee/{emp_id}")
def delete_employee(emp_id: int):
    for employee in employees:
        if employee.id == emp_id:
            employees.remove(employee)
            return {"message": "Employee deleted successfully"}
    return {"error": "Employee not found"}
