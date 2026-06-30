import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000/api";

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    fetch(`${API_BASE}/admin/leaves`)
      .then((res) => res.json())
      .then(setLeaves)
      .catch(() => setError("Could not load leave requests."));
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (employeeId, leaveId, action) => {
    setBusyId(leaveId);
    try {
      await fetch(`${API_BASE}/admin/leaves/${employeeId}/${leaveId}/${action}`, { method: "POST" });
      load();
    } finally {
      setBusyId(null);
    }
  };

  const pending = leaves.filter((l) => l.status === "pending");
  const resolved = leaves.filter((l) => l.status !== "pending").sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

  return (
    <div>
      {error && <p className="error-text">{error}</p>}

      <h2 className="task-section-title">Pending ({pending.length})</h2>
      {pending.length === 0 && <p className="empty-text">No pending leave requests.</p>}
      <div className="admin-list">
        {pending.map((l) => (
          <div className="admin-card" key={l.id}>
            <div>
              <p className="admin-name">{l.employeeName}</p>
              <p className="admin-meta">
                {l.type.charAt(0).toUpperCase() + l.type.slice(1)} · {l.startDate} to {l.endDate}
              </p>
              {l.reason && <p className="admin-meta">{l.reason}</p>}
            </div>
            <div className="admin-actions">
              <button className="approve-btn" disabled={busyId === l.id} onClick={() => act(l.employeeId, l.id, "approve")}>
                Approve
              </button>
              <button className="deny-btn" disabled={busyId === l.id} onClick={() => act(l.employeeId, l.id, "deny")}>
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="task-section-title">History</h2>
      {resolved.length === 0 && <p className="empty-text">No resolved requests yet.</p>}
      <div className="admin-list">
        {resolved.map((l) => (
          <div className="admin-card" key={l.id}>
            <div>
              <p className="admin-name">{l.employeeName}</p>
              <p className="admin-meta">
                {l.type.charAt(0).toUpperCase() + l.type.slice(1)} · {l.startDate} to {l.endDate}
              </p>
            </div>
            <span className={`status-badge ${l.status}`}>{l.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}