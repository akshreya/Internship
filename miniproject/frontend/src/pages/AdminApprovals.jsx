import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000/api";
const DEPARTMENTS = ["Engineering", "Product Design", "Marketing", "HR & Ops", "Finance", "Sales"];

export default function AdminApprovals() {
  const [pending, setPending] = useState([]);
  const [departments, setDepartments] = useState({}); // { [id]: department }
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/pending`);
      const data = await res.json();
      setPending(data);
    } catch {
      setError("Could not load pending requests. Is the backend running?");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setDept = (id, dept) => {
    setDepartments((prev) => ({ ...prev, [id]: dept }));
  };

  const approve = async (id) => {
    const department = departments[id];
    if (!department) {
      setError("Pick a department before approving.");
      return;
    }
    setError("");
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/approve/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not approve.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const deny = async (id) => {
    setBusyId(id);
    try {
      await fetch(`${API_BASE}/admin/deny/${id}`, { method: "POST" });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {error && <p className="error-text">{error}</p>}
      {pending.length === 0 && !error && <p className="empty-text">No pending requests.</p>}

      <div className="admin-list">
        {pending.map((p) => (
          <div key={p.id} className="admin-card">
            <div>
              <p className="admin-name">{p.fname} {p.lname}</p>
              <p className="admin-meta">{p.email} · {p.phone}</p>
            </div>
            <div className="admin-actions">
              <select
                className="dept-select"
                value={departments[p.id] || ""}
                onChange={(e) => setDept(p.id, e.target.value)}
              >
                <option value="" disabled>
                  Department
                </option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button className="approve-btn" disabled={busyId === p.id} onClick={() => approve(p.id)}>
                Approve
              </button>
              <button className="deny-btn" disabled={busyId === p.id} onClick={() => deny(p.id)}>
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
