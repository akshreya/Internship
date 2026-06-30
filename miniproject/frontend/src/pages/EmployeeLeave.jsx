import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000/api";

export default function EmployeeLeave({ employee }) {
  const [leaves, setLeaves] = useState([]);
  const [type, setType] = useState("casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    fetch(`${API_BASE}/employee/${employee.id}/leaves`)
      .then((res) => res.json())
      .then(setLeaves)
      .catch(() => setError("Could not load leave requests."));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError("Pick a start and end date.");
      return;
    }
    setError("");
    try {
      const res = await fetch(`${API_BASE}/employee/${employee.id}/leaves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, startDate, endDate, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit request.");
      setLeaves(data);
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (err) {
      setError(err.message);
    }
  };

  const sorted = [...leaves].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

  return (
    <div>
      <form onSubmit={submit} className="task-form">
        <div className="task-form-row">
          <select value={type} onChange={(e) => setType(e.target.value)} className="task-input">
            <option value="casual">Casual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="other">Other</option>
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="task-input" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="task-input" />
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="task-input task-textarea"
        />
        <button type="submit" className="login-btn task-add-btn">
          Submit Request
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      <h2 className="task-section-title">My Requests</h2>
      {sorted.length === 0 && <p className="empty-text">No leave requests yet.</p>}
      <div className="task-list">
        {sorted.map((l) => (
          <div className="task-card" key={l.id}>
            <div className="task-card-main">
              <span className="task-title">
                {l.type.charAt(0).toUpperCase() + l.type.slice(1)} Leave · {l.startDate} to {l.endDate}
              </span>
              {l.reason && <p className="task-description">{l.reason}</p>}
            </div>
            <span className={`status-badge ${l.status}`}>{l.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}