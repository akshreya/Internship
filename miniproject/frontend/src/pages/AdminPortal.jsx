import { useState } from "react";
import AdminApprovals from "./AdminApprovals";
import AdminLeaves from "./AdminLeaves";
import AdminDashboard from "./AdminDashboard";

const NAV = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: "approvals",
    label: "Approvals",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    id: "leaves",
    label: "Leave Requests",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
];

export default function AdminPortal() {
  const [tab, setTab] = useState("dashboard");
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
            <p className="sidebar-brand-role">Admin Portal</p>
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
          <div className="sidebar-avatar">A</div>
          <div>
            <p className="sidebar-user-name">Admin</p>
            <p className="sidebar-user-role">Administrator</p>
          </div>
        </div>
      </aside>

      <main className="portal-main">
        <div className="portal-topbar">
          <h1 className="portal-page-title">{current?.label}</h1>
        </div>
        <div className="portal-content">
          {tab === "dashboard" && <AdminDashboard />}
          {tab === "approvals" && <AdminApprovals />}
          {tab === "leaves" && <AdminLeaves />}
        </div>
      </main>
    </div>
  );
}
