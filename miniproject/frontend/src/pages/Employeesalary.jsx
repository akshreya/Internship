import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000/api";
const money = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function EmployeeSalary({ employee }) {
  const [basicSalary, setBasicSalary] = useState(0);
  const [slips, setSlips] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/employee/${employee.id}/salary`)
      .then((res) => res.json())
      .then((data) => {
        setBasicSalary(data.basicSalary);
        setSlips(data.salarySlips);
      })
      .catch(() => setError("Could not load salary info."));
  }, []);

  const sorted = [...slips].sort((a, b) => b.month.localeCompare(a.month));
  const latest = sorted[0];

  return (
    <div>
      {error && <p className="error-text">{error}</p>}

      <div className="attendance-stats">
        <div className="stat-box">
          <p className="stat-box-value">{money(basicSalary)}</p>
          <p className="stat-box-label">Basic Salary</p>
        </div>
        <div className="stat-box">
          <p className="stat-box-value">{latest ? money(latest.netSalary) : "—"}</p>
          <p className="stat-box-label">Latest Net Pay</p>
        </div>
        <div className="stat-box">
          <p className="stat-box-value">{latest ? `${latest.completionPercent}%` : "—"}</p>
          <p className="stat-box-label">Task Completion</p>
        </div>
      </div>

      <h2 className="task-section-title">Salary Slips</h2>
      {sorted.length === 0 && (
        <p className="empty-text">No salary slips yet — your admin generates these monthly.</p>
      )}

      <div className="task-list">
        {sorted.map((s) => (
          <div className="salary-slip-card" key={s.month}>
            <div className="salary-slip-header">
              <span className="task-title">{s.month}</span>
              <span className="salary-net">{money(s.netSalary)}</span>
            </div>
            <div className="salary-slip-grid">
              <span>Basic Salary</span>
              <span>{money(s.basicSalary)}</span>
              <span>Working Days</span>
              <span>{s.workingDays}</span>
              <span>Present Days</span>
              <span>{s.presentDays}</span>
              <span>Absent Days</span>
              <span>{s.absentDays}</span>
              <span>Late Count</span>
              <span>{s.lateCount}</span>
              <span>Tasks Completed</span>
              <span>{s.completedTasks}/{s.totalTasks} ({s.completionPercent}%)</span>
              <span>Completion Bonus</span>
              <span className="positive">+{money(s.bonus)}</span>
              {s.manualBonus > 0 && (
                <>
                  <span>Additional Bonus</span>
                  <span className="positive">+{money(s.manualBonus)}</span>
                </>
              )}
              <span>Late Penalty</span>
              <span className="negative">-{money(s.latePenalty)}</span>
              <span>Leave Deduction</span>
              <span className="negative">-{money(s.leaveDeduction)}</span>
              <span>Absent Deduction</span>
              <span className="negative">-{money(s.absentDeduction)}</span>
            </div>
            <div className="salary-slip-footer">
              <span>Net Salary</span>
              <span className="salary-net">{money(s.netSalary)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}