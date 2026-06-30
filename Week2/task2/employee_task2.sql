CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR(100)
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    department_id INT REFERENCES departments(id)
);

CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    attendance_date DATE,
    status VARCHAR(20)
);

CREATE TABLE salary (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    amount DECIMAL(10,2)
);