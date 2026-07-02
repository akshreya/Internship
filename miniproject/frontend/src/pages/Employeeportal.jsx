import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeTasks from "./EmployeeTasks";
import EmployeeAttendance from "./EmployeeAttendance";
import EmployeeLeave from "./EmployeeLeave";
import EmployeeSalary from "./EmployeeSalary";

const API_BASE = "http://localhost:4000/api";
const REMINDER_THRESHOLD_MS = 60 * 60 * 1000;

const NAV = [
  {
    id: "tasks",
    label: "My Tasks",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
  },
  {
    id: "leave",
    label: "Leave",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    id: "salary",
    label: "Salary",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
];

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

  const initials = `${employee.fname?.[0] || ""}${employee.lname?.[0] || ""}`.toUpperCase();
  const current = NAV.find((n) => n.id === tab);

  return (
    <div className="portal-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="4" y="2" width="16" height="20" rx="1"/>
              <path d="M9 22v-4h6v4M9 8h1M9 12h1M14 8h1M14 12h1"/>
            </svg>
          </div>
          <div>
            <p className="sidebar-brand-name">EmpManage</p>
            <p className="sidebar-brand-role">Employee Portal</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`sidebar-item ${tab === n.id ? "sidebar-item-active" : ""}`}
              onClick={() => setTab(n.id)}
            >
              <span className="sidebar-item-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <p className="sidebar-user-name">{employee.fname} {employee.lname}</p>
            <p className="sidebar-user-role">{employee.department}</p>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Log out">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      <main className="portal-main">
        <div className="portal-topbar">
          <h1 className="portal-page-title">{current?.label}</h1>
        </div>
        <div className="portal-content">
          {tab === "tasks" && <EmployeeTasks employee={employee} tasks={tasks} setTasks={setTasks} />}
          {tab === "attendance" && <EmployeeAttendance employee={employee} />}
          {tab === "leave" && <EmployeeLeave employee={employee} />}
          {tab === "salary" && <EmployeeSalary employee={employee} />}
        </div>
      </main>

      {reminder && (
        <div className="reminder-overlay">
          <div className="reminder-modal">
            <h3>⏰ Task due soon</h3>
            <p className="reminder-title">{reminder.title}</p>
            <p className="admin-meta" style={{ marginBottom: "20px" }}>
              {new Date(reminder.deadline) < new Date() ? "Was due" : "Due"}{" "}
              {new Date(reminder.deadline).toLocaleString()}
            </p>
            <button className="login-btn" onClick={() => setReminder(null)}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}
