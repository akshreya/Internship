from fastapi import FastAPI
from database import SessionLocal
from models import Employee
from schemas import EmployeeCreate

app = FastAPI()

@app.post("/employee")
def add_employee(employee: EmployeeCreate):

    db = SessionLocal()

    new_employee = Employee(
        name=employee.name,
        email=employee.email,
        department_id=employee.department_id
    )

    db.add(new_employee)
    db.commit()

    return {"message": "Employee added successfully"}


@app.get("/employee")
def get_employees():

    db = SessionLocal()

    employees = db.query(Employee).all()

    return employees


@app.put("/employee/{employee_id}")
def update_employee(employee_id: int, employee: EmployeeCreate):

    db = SessionLocal()

    existing = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if not existing:
        return {"error": "Employee not found"}

    existing.name = employee.name
    existing.email = employee.email
    existing.department_id = employee.department_id

    db.commit()

    return {"message": "Employee updated successfully"}


@app.delete("/employee/{employee_id}")
def delete_employee(employee_id: int):

    db = SessionLocal()

    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if not employee:
        return {"error": "Employee not found"}

    db.delete(employee)
    db.commit()

    return {"message": "Employee deleted successfully"}
