import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000/api";
const money = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [assigningId, setAssigningId] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [assignError, setAssignError] = useState("");

  const [salaryOpenId, setSalaryOpenId] = useState(null);
  const [basicSalaryInput, setBasicSalaryInput] = useState("");
  const [bonusInput, setBonusInput] = useState("");
  const [salaryMonth, setSalaryMonth] = useState(thisMonth());
  const [latestSlip, setLatestSlip] = useState(null);
  const [salaryError, setSalaryError] = useState("");

  const load = () => {
    fetch(`${API_BASE}/admin/employees`)
      .then((res) => res.json())
      .then(setEmployees)
      .catch(() => setError("Could not load employees. Is the backend running?"));
  };

  useEffect(() => {
    load();
  }, []);

  const removeEmployee = async (id, name) => {
    const sure = window.confirm(`Remove ${name}? This deletes their account permanently.`);
    if (!sure) return;
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/employees/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove employee.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const openAssign = (id) => {
    setSalaryOpenId(null);
    setAssigningId(assigningId === id ? null : id);
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("medium");
    setTaskDeadline("");
    setAssignError("");
  };

  const assignTask = async (id) => {
    if (!taskTitle.trim() || !taskDeadline) {
      setAssignError("Enter a task title and deadline.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/employee/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          priority: taskPriority,
          deadline: taskDeadline,
          assignedBy: "admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not assign task.");
      setAssigningId(null);
      load();
    } catch (err) {
      setAssignError(err.message);
    }
  };

  const openSalary = (emp) => {
    setAssigningId(null);
    setSalaryOpenId(salaryOpenId === emp.id ? null : emp.id);
    setBasicSalaryInput(emp.basicSalary || 30000);
    setBonusInput(emp.manualBonus || 0);
    setSalaryMonth(thisMonth());
    setLatestSlip(null);
    setSalaryError("");
  };

  const saveBasicSalary = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/employees/${id}/basic-salary`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basicSalary: Number(basicSalaryInput) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update basic salary.");
      load();
    } catch (err) {
      setSalaryError(err.message);
    }
  };

  const saveBonus = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/employees/${id}/bonus`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bonus: Number(bonusInput) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update bonus.");
      load();
    } catch (err) {
      setSalaryError(err.message);
    }
  };

  const generateSalary = async (id) => {
    setSalaryError("");
    try {
      const res = await fetch(`${API_BASE}/admin/employees/${id}/salary/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: salaryMonth }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate salary.");
      setLatestSlip(data);
      load();
    } catch (err) {
      setSalaryError(err.message);
    }
  };

  return (
    <div>
      {error && <p className="error-text">{error}</p>}
      {employees.length === 0 && !error && <p className="empty-text">No approved employees yet.</p>}

      <div className="emp-table">
        {employees.length > 0 && (
          <div className="emp-row emp-row-head">
            <span>Name</span>
            <span>Department</span>
            <span>Attendance</span>
            <span>Tasks Done</span>
            <span></span>
          </div>
        )}
        {employees.map((e) => {
          const present = e.attendance?.filter((a) => a.status === "present").length || 0;
          const totalDays = e.attendance?.length || 0;
          const tasksDone = e.tasks?.filter((t) => t.status === "completed").length || 0;
          const totalTasks = e.tasks?.length || 0;
          const fullName = `${e.fname} ${e.lname}`;

          return (
            <div key={e.id}>
              <div className="emp-row">
                <span className="emp-name">{fullName}</span>
                <span className="emp-dept-badge">{e.department}</span>
                <span>{totalDays > 0 ? `${present}/${totalDays} days` : "No records yet"}</span>
                <span>{totalTasks > 0 ? `${tasksDone}/${totalTasks}` : "No tasks yet"}</span>
                <div className="emp-row-actions">
                  <button className="tab-btn" onClick={() => openAssign(e.id)}>
                    {assigningId === e.id ? "Cancel" : "Assign Task"}
                  </button>
                  <button className="tab-btn" onClick={() => openSalary(e)}>
                    {salaryOpenId === e.id ? "Cancel" : "Salary"}
                  </button>
                  <button className="remove-btn" disabled={busyId === e.id} onClick={() => removeEmployee(e.id, fullName)}>
                    Remove
                  </button>
                </div>
              </div>

              {assigningId === e.id && (
                <div className="assign-task-panel">
                  <input
                    placeholder="Task title"
                    value={taskTitle}
                    onChange={(ev) => setTaskTitle(ev.target.value)}
                    className="task-input"
                  />
                  <input
                    placeholder="Description (optional)"
                    value={taskDescription}
                    onChange={(ev) => setTaskDescription(ev.target.value)}
                    className="task-input"
                  />
                  <select
                    value={taskPriority}
                    onChange={(ev) => setTaskPriority(ev.target.value)}
                    className="task-input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={taskDeadline}
                    onChange={(ev) => setTaskDeadline(ev.target.value)}
                    className="task-input task-deadline-input"
                  />
                  <button className="login-btn task-add-btn" onClick={() => assignTask(e.id)}>
                    Assign
                  </button>
                  {assignError && <p className="error-text">{assignError}</p>}
                </div>
              )}

              {salaryOpenId === e.id && (
                <div className="assign-task-panel salary-panel">
                  <div className="task-form-row">
                    <label className="salary-inline-label">Basic Salary</label>
                    <input
                      type="number"
                      value={basicSalaryInput}
                      onChange={(ev) => setBasicSalaryInput(ev.target.value)}
                      className="task-input"
                    />
                    <button className="tab-btn" onClick={() => saveBasicSalary(e.id)}>
                      Save
                    </button>
                  </div>
                  <div className="task-form-row">
                    <label className="salary-inline-label">Bonus (₹)</label>
                    <input
                      type="number"
                      value={bonusInput}
                      onChange={(ev) => setBonusInput(ev.target.value)}
                      className="task-input"
                      placeholder="Extra bonus, e.g. festival/spot bonus"
                    />
                    <button className="tab-btn" onClick={() => saveBonus(e.id)}>
                      Save
                    </button>
                  </div>
                  <div className="task-form-row">
                    <input
                      type="month"
                      value={salaryMonth}
                      onChange={(ev) => setSalaryMonth(ev.target.value)}
                      className="task-input"
                    />
                    <button className="login-btn task-add-btn" onClick={() => generateSalary(e.id)}>
                      Generate Slip
                    </button>
                  </div>
                  {salaryError && <p className="error-text">{salaryError}</p>}
                  {latestSlip && (
                    <div className="salary-slip-grid salary-slip-mini">
                      <span>Net Salary</span>
                      <span className="salary-net">{money(latestSlip.netSalary)}</span>
                      <span>Completion</span>
                      <span>{latestSlip.completionPercent}%</span>
                      <span>Bonus (auto + manual)</span>
                      <span className="positive">+{money(latestSlip.totalBonus)}</span>
                      <span>Penalties</span>
                      <span className="negative">
                        -{money(latestSlip.latePenalty + latestSlip.leaveDeduction + latestSlip.absentDeduction)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}