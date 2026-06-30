import { useState } from "react";
import AdminApprovals from "./AdminApprovals";
import AdminLeaves from "./AdminLeaves";
import AdminDashboard from "./AdminDashboard";

export default function AdminPortal() {
  const [tab, setTab] = useState("approvals"); // "approvals" | "leaves" | "dashboard"

  return (
    <div className="admin-page">
      <h1>Admin Portal</h1>

      <div className="admin-tabs">
        <button className={tab === "approvals" ? "tab-btn tab-active" : "tab-btn"} onClick={() => setTab("approvals")}>
          Approvals
        </button>
        <button className={tab === "leaves" ? "tab-btn tab-active" : "tab-btn"} onClick={() => setTab("leaves")}>
          Leaves
        </button>
        <button className={tab === "dashboard" ? "tab-btn tab-active" : "tab-btn"} onClick={() => setTab("dashboard")}>
          Dashboard
        </button>
      </div>

      {tab === "approvals" && <AdminApprovals />}
      {tab === "leaves" && <AdminLeaves />}
      {tab === "dashboard" && <AdminDashboard />}
    </div>
  );
}