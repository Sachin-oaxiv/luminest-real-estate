import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import branding from "../config/branding.js";
import PrivacyGuard from "../components/shared/PrivacyGuard.jsx";

const navigation = {
  admin: [
    { label: "Dashboard", path: "/admin", icon: "⌂" },
    { label: "Employees", path: "/admin/employees", icon: "♙" },
    { label: "Attendance", path: "/admin/attendance", icon: "◷" },
    { label: "Customers", path: "/admin/customers", icon: "♧" },
    { label: "Assignments", path: "/admin/assignments", icon: "⇄" },
    { label: "Activities", path: "/admin/activities", icon: "▤" },
    { label: "Media", path: "/admin/media", icon: "▣" },
    { label: "Announcements", path: "/admin/announcements", icon: "♢" },
    { label: "Reports", path: "/admin/reports", icon: "▥" },
    { label: "Special Permissions", path: "/admin/special-permissions", icon: "⌖" },
  ],
  executive: [
    { label: "Dashboard", path: "/executive", icon: "⌂" },
    { label: "Customers", path: "/executive/customers", icon: "♧" },
    { label: "Employees", path: "/executive/employees", icon: "♙" },
    { label: "Assignments", path: "/executive/assignments", icon: "⇄" },
    { label: "Reports", path: "/executive/reports", icon: "▥" },
    { label: "Special Permissions", path: "/executive/special-permissions", icon: "⌖" },
  ],
  inside_sales: [
    { label: "Dashboard", path: "/inside-sales", icon: "⌂" },
    { label: "My Customers", path: "/inside-sales/customers", icon: "♧" },
    { label: "Call Activities", path: "/inside-sales/calls", icon: "☏" },
    { label: "Messages", path: "/inside-sales/messages", icon: "✉" },
    { label: "Visits", path: "/inside-sales/visits", icon: "▣" },
  ],
  outside_sales: [
    { label: "Dashboard", path: "/outside-sales", icon: "⌂" },
    { label: "My Visits", path: "/outside-sales/visits", icon: "▣" },
    { label: "Visit Evidence", path: "/outside-sales/evidence", icon: "▧" },
  ],
};

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role;
  const menuItems = navigation[role] || [];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const roleName = {
    admin: "Administrator",
    executive: "Executive",
    inside_sales: "Inside Sales",
    outside_sales: "Outside Sales",
  };

  const privacyEnabled = role === "inside_sales" || role === "outside_sales";

  return (
    <PrivacyGuard enabled={privacyEnabled}>
    <div className="dashboard-shell">
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside className={`dashboard-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-brand">
          <div className="dashboard-brand-mark">L</div>
          <div>
            <strong>{branding.companyName}</strong>
            <span>REAL ESTATE</span>
          </div>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="dashboard-navigation">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/${role === "inside_sales" ? "inside-sales" : role === "outside_sales" ? "outside-sales" : role}`}
              className={({ isActive }) =>
                `dashboard-nav-link ${isActive ? "active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-company-note">
            <span>PROPERTY MANAGEMENT</span>
            <strong>People · Property · Progress</strong>
          </div>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>
            <div>
              <span className="topbar-eyebrow">EMPLOYEE WORKSPACE</span>
              <h2>Dashboard</h2>
            </div>
          </div>

          <div className="topbar-user">
            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="user-details">
              <strong>{user?.name || "Employee"}</strong>
              <span>{roleName[role] || "Employee"}</span>
            </div>
            <button
              className="logout-button"
              onClick={handleLogout}
              title="Logout"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
    </PrivacyGuard>
  );
}
