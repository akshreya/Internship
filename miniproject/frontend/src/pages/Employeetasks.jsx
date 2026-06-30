import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000/api";

function formatDeadline(deadline) {
  if (!deadline) return null;
  return new Date(deadline).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function EmployeeTasks({ employee, tasks, setTasks }) {
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDeadline, setNewDeadline] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [liveDateTime, setLiveDateTime] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setLiveDateTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/employee/${employee.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          priority: newPriority,
          deadline: newDeadline || null,
          assignedBy: "self",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add task.");
      setTasks(data);
      setNewTitle("");
      setNewDescription("");
      setNewDeadline("");
      setNewPriority("medium");
    } catch (err) {
      setError(err.message);
    }
  };

  const setStatus = async (taskId, status) => {
    setBusyId(taskId);
    try {
      const res = await fetch(`${API_BASE}/employee/${employee.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      setTasks(data);
    } finally {
      setBusyId(null);
    }
  };

  const deleteTask = async (taskId) => {
    setBusyId(taskId);
    try {
      const res = await fetch(`${API_BASE}/employee/${employee.id}/tasks/${taskId}`, { method: "DELETE" });
      const data = await res.json();
      setTasks(data);
    } finally {
      setBusyId(null);
    }
  };

  const isOverdue = (t) => t.status !== "completed" && t.deadline && new Date(t.deadline) < liveDateTime;
  const displayStatus = (t) => (isOverdue(t) ? "overdue" : t.status);

  const sorted = [...tasks].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (b.status === "completed" && a.status !== "completed") return -1;
    return 0;
  });

  return (
    <div>
      <p className="live-clock">Current time: {liveDateTime.toLocaleString()}</p>

      <form onSubmit={addTask} className="task-form">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Task title"
          className="task-input"
        />
        <textarea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Description (optional)"
          className="task-input task-textarea"
        />
        <div className="task-form-row">
          <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="task-input">
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>
          <input
            type="datetime-local"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            className="task-input"
          />
          <button type="submit" className="login-btn task-add-btn">
            Add
          </button>
        </div>
      </form>

      {error && <p className="error-text">{error}</p>}

      <div className="task-list">
        {sorted.length === 0 && <p className="empty-text">No tasks yet.</p>}
        {sorted.map((t) => {
          const status = displayStatus(t);
          return (
            <div className={`task-card ${status === "completed" ? "task-card-done" : ""}`} key={t.id}>
              <div className="task-card-main">
                <div className="task-card-title-row">
                  <span className="task-title">{t.title}</span>
                  <span className={`priority-badge priority-${t.priority}`}>{t.priority}</span>
                  {t.assignedBy === "admin" && <span className="assigned-badge">Assigned by admin</span>}
                </div>
                {t.description && <p className="task-description">{t.description}</p>}
                {t.deadline && (
                  <span className={status === "overdue" ? "deadline-tag overdue" : "deadline-tag"}>
                    {status === "overdue" ? "Overdue · " : "Due "}
                    {formatDeadline(t.deadline)}
                  </span>
                )}
              </div>
              <div className="task-card-actions">
                <select
                  className="status-select"
                  value={t.status}
                  disabled={busyId === t.id}
                  onChange={(e) => setStatus(t.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button className="remove-btn" disabled={busyId === t.id} onClick={() => deleteTask(t.id)}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}