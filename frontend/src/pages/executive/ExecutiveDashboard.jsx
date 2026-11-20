
import { useCallback, useEffect, useMemo, useState } from "react";
import executiveService from "../../services/executiveService.js";
import "../../styles/pages/executive-dashboard.css";

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatLabel = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

const ExecutiveDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await executiveService.getDashboardData();

      setCustomers(result.customers || []);
      setAssignments(result.assignments || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load Executive Dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const metrics = useMemo(() => {
    const activeCustomers = customers.filter(
      (customer) => customer.isActive !== false
    );

    const assignedCustomers = activeCustomers.filter(
      (customer) => customer.assignedTo
    );

    const unassignedCustomers = activeCustomers.filter(
      (customer) => !customer.assignedTo
    );

    const qualifiedCustomers = activeCustomers.filter(
      (customer) => customer.status === "qualified"
    );

    const visitScheduledCustomers = activeCustomers.filter(
      (customer) => customer.status === "visit_scheduled"
    );

    return {
      totalCustomers: customers.length,
      activeCustomers: activeCustomers.length,
      assignedCustomers: assignedCustomers.length,
      unassignedCustomers: unassignedCustomers.length,
      qualifiedCustomers: qualifiedCustomers.length,
      visitScheduledCustomers: visitScheduledCustomers.length,
      totalAssignments: assignments.length,
    };
  }, [customers, assignments]);

  const recentCustomers = useMemo(() => {
    return [...customers]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )
      .slice(0, 6);
  }, [customers]);

  const employeeWorkload = useMemo(() => {
    const workload = new Map();

    assignments.forEach((assignment) => {
      const employee =
        assignment.assignedTo ||
        assignment.employee ||
        assignment.assignedEmployee;

      if (!employee || typeof employee !== "object") return;

      const id = employee._id || employee.id;
      if (!id) return;

      const existing = workload.get(id) || {
        id,
        name: employee.name || "Unknown Employee",
        email: employee.email || "",
        count: 0,
      };

      existing.count += 1;
      workload.set(id, existing);
    });

    return Array.from(workload.values()).sort(
      (a, b) => b.count - a.count
    );
  }, [assignments]);

  if (loading) {
    return (
      <main className="lm-executive-dashboard">
        <div className="lm-executive-state">
          Loading Executive Dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="lm-executive-dashboard">
      <header className="lm-executive-header">
        <div>
          <span className="lm-executive-eyebrow">
            LUMINEST · MANAGEMENT WORKSPACE
          </span>

          <h1>Executive Dashboard</h1>

          <p>
            Monitor customer acquisition, lead allocation and
            your Inside Sales team's workload.
          </p>
        </div>

        <button
          type="button"
          className="lm-executive-refresh"
          onClick={fetchDashboard}
          disabled={loading}
        >
          ↻ Refresh Data
        </button>
      </header>

      {error && (
        <div className="lm-executive-error">
          <p>{error}</p>

          <button type="button" onClick={fetchDashboard}>
            Try Again
          </button>
        </div>
      )}

      <section className="lm-executive-welcome">
        <div>
          <span>EXECUTIVE OVERVIEW</span>
          <h2>Manage your business operations.</h2>
          <p>
            Review your customer pipeline, monitor assignments
            and keep your sales operations moving.
          </p>
        </div>

        <div className="lm-executive-welcome-mark">L</div>
      </section>

      <section className="lm-executive-section">
        <div className="lm-executive-section-heading">
          <div>
            <h2>Business Overview</h2>
            <p>Current customer and assignment statistics.</p>
          </div>
        </div>

        <div className="lm-executive-stats">
          <article className="lm-executive-stat">
            <span>Total Customers</span>
            <strong>{metrics.totalCustomers}</strong>
            <small>All customer records</small>
          </article>

          <article className="lm-executive-stat">
            <span>Active Customers</span>
            <strong>{metrics.activeCustomers}</strong>
            <small>Currently active leads</small>
          </article>

          <article className="lm-executive-stat">
            <span>Assigned Customers</span>
            <strong>{metrics.assignedCustomers}</strong>
            <small>Allocated to Inside Sales</small>
          </article>

          <article className="lm-executive-stat">
            <span>Unassigned Customers</span>
            <strong>{metrics.unassignedCustomers}</strong>
            <small>Awaiting allocation</small>
          </article>

          <article className="lm-executive-stat">
            <span>Qualified Leads</span>
            <strong>{metrics.qualifiedCustomers}</strong>
            <small>Customers marked qualified</small>
          </article>

          <article className="lm-executive-stat">
            <span>Visit Scheduled</span>
            <strong>{metrics.visitScheduledCustomers}</strong>
            <small>Customers with visits scheduled</small>
          </article>
        </div>
      </section>

      <section className="lm-executive-section">
        <div className="lm-executive-section-heading">
          <div>
            <h2>Customer Allocation</h2>
            <p>Overview of your customer assignment pipeline.</p>
          </div>
        </div>

        <div className="lm-executive-allocation">
          <article>
            <span>Total Assignments</span>
            <strong>{metrics.totalAssignments}</strong>
          </article>

          <article>
            <span>Assigned Customers</span>
            <strong>{metrics.assignedCustomers}</strong>
          </article>

          <article>
            <span>Awaiting Assignment</span>
            <strong>{metrics.unassignedCustomers}</strong>
          </article>
        </div>
      </section>

      <section className="lm-executive-section">
        <div className="lm-executive-section-heading">
          <div>
            <h2>Inside Sales Workload</h2>
            <p>Assignment distribution by employee.</p>
          </div>
        </div>

        {employeeWorkload.length === 0 ? (
          <div className="lm-executive-empty">
            No employee assignment data is available yet.
          </div>
        ) : (
          <div className="lm-executive-workload">
            {employeeWorkload.map((employee) => (
              <article
                className="lm-executive-workload-card"
                key={employee.id}
              >
                <div>
                  <strong>{employee.name}</strong>
                  <span>{employee.email}</span>
                </div>

                <div className="lm-executive-workload-count">
                  <strong>{employee.count}</strong>
                  <span>Customers</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="lm-executive-section">
        <div className="lm-executive-section-heading">
          <div>
            <h2>Recent Customers</h2>
            <p>Your six most recently created customer records.</p>
          </div>
        </div>

        {recentCustomers.length === 0 ? (
          <div className="lm-executive-empty">
            No customer records found.
          </div>
        ) : (
          <div className="lm-executive-table-wrap">
            <table className="lm-executive-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {recentCustomers.map((customer) => (
                  <tr key={customer._id}>
                    <td>
                      <strong>{customer.name}</strong>
                    </td>

                    <td>{customer.phone || "—"}</td>

                    <td>
                      {customer.preferredLocation || "—"}
                    </td>

                    <td>
                      {customer.assignedTo?.name || "Unassigned"}
                    </td>

                    <td>
                      <span className="lm-executive-status">
                        {formatLabel(customer.status || "new")}
                      </span>
                    </td>

                    <td>{formatDate(customer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};

export default ExecutiveDashboard;
