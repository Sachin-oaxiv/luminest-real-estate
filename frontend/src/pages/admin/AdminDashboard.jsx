
import { useCallback, useEffect, useState } from "react";
import dashboardService from "../../services/dashboardService.js";
import { useAuth } from "../../context/AuthContext.jsx";

const formatLabel = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const formatDateTime = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatToday = () =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

function StatCard({ title, value, description, icon, tone }) {
  return (
    <article className="admin-stat-card">
      <div className={`admin-stat-icon ${tone}`}>{icon}</div>

      <div className="admin-stat-content">
        <p>{title}</p>
        <h2>{value ?? 0}</h2>
        <span>{description}</span>
      </div>
    </article>
  );
}

function BreakdownCard({ title, subtitle, items, emptyMessage }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="admin-overview-card">
      <div className="admin-card-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>

        <span className="admin-card-total">{total}</span>
      </div>

      {items.length === 0 ? (
        <p className="admin-empty-state">{emptyMessage}</p>
      ) : (
        <div className="admin-breakdown-list">
          {items.map((item) => {
            const percentage = total
              ? Math.round((item.count / total) * 100)
              : 0;

            return (
              <div className="admin-breakdown-item" key={item.label}>
                <div className="admin-breakdown-info">
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </div>

                <div className="admin-progress-track">
                  <div
                    className="admin-progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }) {
  const normalized = (status || "unknown").toLowerCase();

  return (
    <span className={`admin-status-badge status-${normalized}`}>
      {formatLabel(normalized)}
    </span>
  );
}

function ActivityIcon({ type }) {
  const icons = {
    customer: "C",
    call: "P",
    message: "M",
    visit: "V",
  };

  return (
    <div className={`admin-activity-icon activity-${type || "default"}`}>
      {icons[type] || "A"}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const [overview, setOverview] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [announcements, setAnnouncements] = useState([]);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

     const [
          overviewData,
          customerData,
          visitData,
          activitiesData,
          announcementsData,
        ] = await Promise.all([
          dashboardService.getDashboardOverview(),
          dashboardService.getDashboardCustomers(),
          dashboardService.getDashboardVisits(),
          dashboardService.getRecentActivities(),
          dashboardService.getAnnouncements(),
        ]);

        setOverview(overviewData);
        setCustomers(customerData.slice(0, 5));
        setVisits(visitData.slice(0, 5));
        setActivities(activitiesData);
        setAnnouncements(announcementsData);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <main className="admin-dashboard">
        <div className="admin-dashboard-loading">
          <div className="admin-loading-spinner" />
          <p>Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="admin-dashboard">
        <div className="admin-dashboard-error">
          <h2>Dashboard unavailable</h2>
          <p>{error}</p>
          <button onClick={fetchDashboard}>Try again</button>
        </div>
      </main>
    );
  }

  const employees = overview?.employees || {};
  const customerStats = overview?.customers || {};
  const visitStats = overview?.visits || {};

  const employeeRoles = (employees.byRole || []).map((item) => ({
    label: formatLabel(item._id),
    count: item.count,
  }));

  const customerStatuses = (customerStats.byStatus || []).map((item) => ({
    label: formatLabel(item._id),
    count: item.count,
  }));

  const visitStatuses = (visitStats.byStatus || []).map((item) => ({
    label: formatLabel(item._id),
    count: item.count,
  }));

  const completedVisits =
    (visitStats.byStatus || []).find((item) => item._id === "completed")
      ?.count || 0;

  return (
    <main className="admin-dashboard">
      {/* Dashboard Header */}
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-eyebrow">OVERVIEW</p>
          <h1>Welcome back, {user?.name || "Admin"}</h1>
          <p className="admin-dashboard-subtitle">
            Here's what's happening across your business today.
          </p>
        </div>

        <div className="admin-dashboard-date">
          <span>Today</span>
          <strong>{formatToday()}</strong>
        </div>
      </header>

      {/* Statistics Cards */}
      <section className="admin-stats-grid">
        <StatCard
          title="Total Employees"
          value={employees.total}
          description={`${employees.active || 0} currently active`}
          icon="E"
          tone="blue"
        />

        <StatCard
          title="Active Employees"
          value={employees.active}
          description={`${employees.inactive || 0} inactive employees`}
          icon="A"
          tone="green"
        />

        <StatCard
          title="Total Customers"
          value={customerStats.total}
          description={`${customerStats.active || 0} active customers`}
          icon="C"
          tone="purple"
        />

        <StatCard
          title="Total Visits"
          value={visitStats.total}
          description={`${completedVisits} completed visits`}
          icon="V"
          tone="orange"
        />
      </section>

      {/* Overview Breakdown */}
      <section className="admin-overview-grid">
        <BreakdownCard
          title="Employees by Role"
          subtitle="Workforce distribution"
          items={employeeRoles}
          emptyMessage="No employee information available."
        />

        <BreakdownCard
          title="Customer Pipeline"
          subtitle="Customers grouped by sales journey"
          items={customerStatuses}
          emptyMessage="No customer information available."
        />

        <BreakdownCard
          title="Visit Overview"
          subtitle="Property visit status"
          items={visitStatuses}
          emptyMessage="No visit information available."
        />
      </section>

      {/* Recent Customers */}
      <section className="admin-data-section">
        <div className="admin-section-heading">
          <div>
            <h2>Recent Customers</h2>
            <p>Latest customer records in your system</p>
          </div>

          <span className="admin-section-count">
            {customers.length} shown
          </span>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Interested Property</th>
                <th>Assigned Employee</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>

            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="admin-table-empty">
                    No customer records available.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id}>
                    <td>
                      <strong>{customer.name}</strong>
                    </td>

                    <td>{customer.phone || "—"}</td>
                    <td>{customer.interestedProperty || "—"}</td>
                    <td>{customer.assignedTo?.name || "Unassigned"}</td>

                    <td>
                      <StatusBadge status={customer.status} />
                    </td>

                    <td>{formatDate(customer.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Property Visits */}
      <section className="admin-data-section">
        <div className="admin-section-heading">
          <div>
            <h2>Recent Property Visits</h2>
            <p>Latest scheduled and completed property visits</p>
          </div>

          <span className="admin-section-count">
            {visits.length} shown
          </span>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Property</th>
                <th>Outside Sales</th>
                <th>Scheduled Date</th>
                <th>Visit Status</th>
              </tr>
            </thead>

            <tbody>
              {visits.length === 0 ? (
                <tr>
                  <td colSpan="5" className="admin-table-empty">
                    No property visits available.
                  </td>
                </tr>
              ) : (
                visits.map((visit) => (
                  <tr key={visit._id}>
                    <td>
                      <strong>
                        {visit.customer?.name || "Unknown Customer"}
                      </strong>
                    </td>

                    <td>{visit.propertyName || "—"}</td>
                    <td>{visit.assignedTo?.name || "—"}</td>
                    <td>{formatDate(visit.scheduledDate)}</td>

                    <td>
                      <StatusBadge status={visit.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Activities */}
      <section className="admin-data-section admin-activities-section">
        <div className="admin-section-heading">
          <div>
            <h2>Recent Activities</h2>
            <p>Latest updates and actions across your team</p>
          </div>

          <span className="admin-section-count">
            {activities.length} activities
          </span>
        </div>

        <div className="admin-activities-list">
          {activities.length === 0 ? (
            <p className="admin-table-empty">
              No recent activities available.
            </p>
          ) : (
            activities.map((activity) => (
              <article
                className="admin-activity-item"
                key={activity.id}
              >
                <ActivityIcon type={activity.type} />

                <div className="admin-activity-content">
                  <h3>{activity.title}</h3>

                  <p>{activity.description}</p>

                  <div className="admin-activity-meta">
                    <span>
                      By {activity.performedBy || "System"}
                    </span>

                    <span>
                      {formatDateTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
         
{/* Company Announcements */}
      <section className="admin-data-section admin-announcements-section">
        <div className="admin-section-heading">
          <div>
            <h2>Company Announcements</h2>
            <p>Important updates and messages for your team</p>
          </div>

          <span className="admin-section-count">
            {announcements.length} announcements
          </span>
        </div>

        <div className="admin-announcements-list">
          {announcements.length === 0 ? (
            <p className="admin-table-empty">
              No announcements available.
            </p>
          ) : (
            announcements.map((announcement) => (
              <article
                className="admin-announcement-card"
                key={announcement._id}
              >
                <div className="admin-announcement-top">
                  <div>
                    <h3>{announcement.title}</h3>
                    <p>{announcement.message}</p>
                  </div>

                  <span
                    className={`admin-announcement-priority priority-${announcement.priority}`}
                  >
                    {formatLabel(announcement.priority)}
                  </span>
                </div>

                <div className="admin-announcement-meta">
                  <span>
                    Posted by {announcement.createdBy?.name || "Admin"}
                  </span>

                  <span>
                    {formatDate(announcement.createdAt)}
                  </span>

                  <span>
                    For: {announcement.targetRoles
                      .map((role) => formatLabel(role))
                      .join(", ")}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Dashboard Footer */}
      <footer className="admin-dashboard-footer">
        <span>Business overview</span>
        <span>Data retrieved from your management database</span>
      </footer>
    </main>
  );
}
