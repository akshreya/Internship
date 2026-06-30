import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000/api";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function fmtTime(iso) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—";
}

export default function EmployeeAttendance({ employee }) {
  const [attendance, setAttendance] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    fetch(`${API_BASE}/employee/${employee.id}/attendance`)
      .then((res) => res.json())
      .then(setAttendance)
      .catch(() => setError("Could not load attendance."));
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (action) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/employee/${employee.id}/attendance/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");
      setAttendance(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const today = todayStr();
  const todayRecord = attendance.find((a) => a.date === today);
  const sortedHistory = [...attendance].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      {error && <p className="error-text">{error}</p>}

      <div className="attendance-today">
        {!todayRecord && <p className="attendance-today-status">You haven't checked in today.</p>}
        {todayRecord && !todayRecord.checkOut && (
          <p className="attendance-today-status">
            ✅ Checked in at {fmtTime(todayRecord.checkIn)}
            {todayRecord.lateMinutes > 0 && ` (${todayRecord.lateMinutes} min late)`}
          </p>
        )}
        {todayRecord?.checkOut && (
          <p className="attendance-today-status">
            ✅ {fmtTime(todayRecord.checkIn)} → {fmtTime(todayRecord.checkOut)} ({todayRecord.workingHours}h)
          </p>
        )}

        <div className="attendance-buttons">
          {!todayRecord && (
            <button className="login-btn task-add-btn" disabled={loading} onClick={() => act("checkin")}>
              Check In
            </button>
          )}
          {todayRecord && !todayRecord.checkOut && (
            <button className="login-btn task-add-btn" disabled={loading} onClick={() => act("checkout")}>
              Check Out
            </button>
          )}
        </div>
      </div>

      <h2 className="task-section-title">History</h2>
      {sortedHistory.length === 0 && <p className="empty-text">No attendance records yet.</p>}
      <div className="attendance-history-table">
        {sortedHistory.length > 0 && (
          <div className="attendance-row attendance-row-head">
            <span>Date</span>
            <span>Check In</span>
            <span>Check Out</span>
            <span>Hours</span>
            <span>Late</span>
            <span>Status</span>
          </div>
        )}
        {sortedHistory.map((a) => (
          <div className="attendance-row" key={a.date}>
            <span>{new Date(a.date).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
            <span>{fmtTime(a.checkIn)}</span>
            <span>{fmtTime(a.checkOut)}</span>
            <span>{a.workingHours || "—"}</span>
            <span>{a.lateMinutes > 0 ? `${a.lateMinutes}m` : "—"}</span>
            <span className={`status-badge ${a.status}`}>{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}