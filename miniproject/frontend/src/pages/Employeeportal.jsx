import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeTasks from "./EmployeeTasks";
import EmployeeAttendance from "./EmployeeAttendance";
import EmployeeLeave from "./EmployeeLeave";
import EmployeeSalary from "./EmployeeSalary";

const API_BASE = "http://localhost:4000/api";
const REMINDER_THRESHOLD_MS = 60 * 60 * 1000; // pop up when within 1 hour of the deadline

export default function EmployeePortal() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("tasks");
  const [tasks, setTasks] = useState([]);
  const [reminder, setReminder] = useState(null);
  const remindedIds = useRef(new Set());

  const stored = localStorage.getItem("employee") || sessionStorage.getItem("employee");
  const employee = stored ? JSON.parse(stored) : null;

  const loadTasks = () => {
    if (!employee) return;
    fetch(`${API_BASE}/employee/${employee.id}/tasks`)
      .then((res) => res.json())
      .then(setTasks)
      .catch(() => {});
  };

  useEffect(() => {
    loadTasks();
    const poll = setInterval(loadTasks, 30000);
    return () => clearInterval(poll);
  }, []);

  // liveDateTime check — compares now vs each task's deadline
  useEffect(() => {
    const checkDeadlines = () => {
      const liveDateTime = new Date();
      const dueSoon = tasks.find((t) => {
        if (t.status === "completed" || !t.deadline) return false;
        if (remindedIds.current.has(t.id)) return false;
        const msLeft = new Date(t.deadline) - liveDateTime;
        return msLeft <= REMINDER_THRESHOLD_MS;
      });
      if (dueSoon) {
        remindedIds.current.add(dueSoon.id);
        setReminder(dueSoon);
      }
    };
    checkDeadlines();
    const timer = setInterval(checkDeadlines, 15000);
    return () => clearInterval(timer);
  }, [tasks]);

  if (!employee) {
    navigate("/");
    return null;
  }

  const logout = () => {
    localStorage.removeItem("employee");
    sessionStorage.removeItem("employee");
    navigate("/");
  };

  return (
    <div className="admin-page">
      <div className="emp-header-row">
        <div>
          <h1>Hi, {employee.fname}</h1>
          <p className="admin-meta" style={{ textAlign: "center" }}>
            {employee.department}
          </p>
        </div>
        <button className="remove-btn" onClick={logout}>
          Log out
        </button>
      </div>

      <div className="admin-tabs">
        <button className={tab === "tasks" ? "tab-btn tab-active" : "tab-btn"} onClick={() => setTab("tasks")}>
          Tasks
        </button>
        <button
          className={tab === "attendance" ? "tab-btn tab-active" : "tab-btn"}
          onClick={() => setTab("attendance")}
        >
          Attendance
        </button>
        <button className={tab === "leave" ? "tab-btn tab-active" : "tab-btn"} onClick={() => setTab("leave")}>
          Leave
        </button>
        <button className={tab === "salary" ? "tab-btn tab-active" : "tab-btn"} onClick={() => setTab("salary")}>
          Salary
        </button>
      </div>

      {tab === "tasks" && <EmployeeTasks employee={employee} tasks={tasks} setTasks={setTasks} />}
      {tab === "attendance" && <EmployeeAttendance employee={employee} />}
      {tab === "leave" && <EmployeeLeave employee={employee} />}
      {tab === "salary" && <EmployeeSalary employee={employee} />}

      {reminder && (
        <div className="reminder-overlay">
          <div className="reminder-modal">
            <h3>⏰ Task due soon</h3>
            <p className="reminder-title">{reminder.title}</p>
            <p className="admin-meta">
              {new Date(reminder.deadline) < new Date() ? "Was due" : "Due"}{" "}
              {new Date(reminder.deadline).toLocaleString()}
            </p>
            <button className="login-btn" onClick={() => setReminder(null)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}