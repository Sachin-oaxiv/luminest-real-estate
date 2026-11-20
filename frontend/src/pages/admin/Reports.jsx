
import { useCallback, useEffect, useMemo, useState } from "react";
import reportService from "../../services/reportService.js";
import "../../styles/pages/reports.css";

const formatLabel = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

const formatRole = (role = "") => formatLabel(role);

const calculatePercentage = (value, total) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

function MetricCard({ label, value, description, icon, tone }) {
  return (
    <article className="lm-report-metric">
      <div className={`lm-report-metric-icon ${tone}`}>
        {icon}
      </div>
      <div className="lm-report-metric-content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </article>
  );
}

function BreakdownList({ title, description, items, total }) {
  return (
    <section className="lm-report-panel">
      <div className="lm-report-panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="lm-report-no-data">
          No data available
        </div>
      ) : (
        <div className="lm-report-breakdown">
          {items.map((item) => {
            const percentage = calculatePercentage(
              item.count,
              total
            );

            return (
              <div className="lm-report-breakdown-item" key={item._id}>
                <div className="lm-report-breakdown-label">
                  <span>{formatLabel(item._id || "Unknown")}</span>
                  <strong>{item.count}</strong>
                </div>

                <div className="lm-report-progress-track">
                  <div
                    className="lm-report-progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <small>{percentage}% of total</small>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function Reports() {
  const [employeeReport, setEmployeeReport] = useState([]);
  const [customerReport, setCustomerReport] = useState(null);
  const [visitReport, setVisitReport] = useState(null);
  const [salesReport, setSalesReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        employeeResponse,
        customerResponse,
        visitResponse,
        salesResponse,
      ] = await Promise.all([
        reportService.getEmployeePerformance(),
        reportService.getCustomerPerformance(),
        reportService.getVisitPerformance(),
        reportService.getSalesConversion(),
      ]);

      setEmployeeReport(employeeResponse.report || []);
      setCustomerReport(customerResponse.report || null);
      setVisitReport(visitResponse.report || null);
      setSalesReport(salesResponse.report || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load reports. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const totals = useMemo(() => {
    const totalCalls = employeeReport.reduce(
      (sum, item) => sum + (item.calls?.total || 0),
      0
    );

    const totalAnsweredCalls = employeeReport.reduce(
      (sum, item) => sum + (item.calls?.answered || 0),
      0
    );

    const totalCompletedVisits = employeeReport.reduce(
      (sum, item) => sum + (item.visits?.completed || 0),
      0
    );

    return {
      employees: employeeReport.length,
      calls: totalCalls,
      answeredCalls: totalAnsweredCalls,
      completedVisits: totalCompletedVisits,
    };
  }, [employeeReport]);

  const customerStats = customerReport?.customers || {};
  const visitStats = visitReport || {};
  const salesStats = salesReport || {};

  const employeeRows = employeeReport;

  if (loading) {
    return (
      <main className="admin-page lm-reports-page">
        <div className="lm-reports-loading">
          <div className="admin-loading-spinner" />
          <p>Preparing your business reports...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page lm-reports-page">
      {/* Page header */}
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">
            BUSINESS INTELLIGENCE & ANALYTICS
          </p>
          <h1>Reports & Analytics</h1>
          <p>
            Monitor employee performance, customer activity,
            property visits and sales conversion.
          </p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={fetchReports}
          disabled={loading}
        >
          ↻ Refresh Reports
        </button>
      </header>

      {error && (
        <div className="admin-alert admin-alert-error">
          <span>{error}</span>
          <button type="button" onClick={fetchReports}>
            Retry
          </button>
        </div>
      )}

      {!error && (
        <>
          {/* Main KPI cards */}
          <section className="lm-reports-section">
            <div className="lm-reports-section-heading">
              <div>
                <h2>Business Overview</h2>
                <p>All-time performance across your organization</p>
              </div>
              <span className="lm-report-period">
                All-time data
              </span>
            </div>

            <div className="lm-reports-metrics">
              <MetricCard
                label="Total Employees"
                value={totals.employees}
                description="Employees in reports"
                icon="♙"
                tone="blue"
              />

              <MetricCard
                label="Total Customers"
                value={customerStats.total || 0}
                description={`${customerStats.active || 0} active customers`}
                icon="♧"
                tone="green"
              />

              <MetricCard
                label="Total Calls"
                value={totals.calls}
                description={`${totals.answeredCalls} answered calls`}
                icon="☏"
                tone="purple"
              />

              <MetricCard
                label="Completed Visits"
                value={totals.completedVisits}
                description={`${visitStats.totalVisits || 0} total visits`}
                icon="⌖"
                tone="orange"
              />
            </div>
          </section>

          {/* Sales conversion */}
          <section className="lm-reports-section">
            <div className="lm-reports-section-heading">
              <div>
                <h2>Sales Performance</h2>
                <p>Customer pipeline and conversion overview</p>
              </div>
            </div>

            <div className="lm-report-sales-card">
              <div className="lm-report-sales-primary">
                <span>Customer Conversion Rate</span>
                <strong>
                  {salesStats.conversionRate || 0}%
                </strong>
                <small>
                  Percentage of active customers successfully closed
                </small>
              </div>

              <div className="lm-report-sales-divider" />

              <div className="lm-report-sales-stat">
                <span>Total Customers</span>
                <strong>{salesStats.totalCustomers || 0}</strong>
              </div>

              <div className="lm-report-sales-stat">
                <span>Closed Customers</span>
                <strong>{salesStats.closedCustomers || 0}</strong>
              </div>

              <div className="lm-report-sales-stat">
                <span>Lost Customers</span>
                <strong>{salesStats.lostCustomers || 0}</strong>
              </div>
            </div>
          </section>

          {/* Customer and visit analytics */}
          <section className="lm-reports-section">
            <div className="lm-reports-section-heading">
              <div>
                <h2>Customer & Visit Analytics</h2>
                <p>Understand customer progress and visit outcomes</p>
              </div>
            </div>

            <div className="lm-reports-two-column">
              <BreakdownList
                title="Customers by Status"
                description="Distribution of active customers"
                items={customerReport?.byStatus || []}
                total={customerStats.active || 0}
              />

              <BreakdownList
                title="Customer Interest"
                description="Customer interest status breakdown"
                items={customerReport?.byInterest || []}
                total={customerStats.active || 0}
              />

              <BreakdownList
                title="Visits by Status"
                description="Overall property visit status"
                items={visitReport?.byStatus || []}
                total={visitStats.totalVisits || 0}
              />

              <BreakdownList
                title="Visit Outcomes"
                description="Customer response after property visits"
                items={visitReport?.byOutcome || []}
                total={visitStats.totalVisits || 0}
              />
            </div>
          </section>

          {/* Employee performance */}
          <section className="lm-reports-section">
            <div className="lm-reports-section-heading">
              <div>
                <h2>Employee Performance</h2>
                <p>
                  Calls, customer assignments and property visits
                  by employee
                </p>
              </div>
            </div>

            <div className="lm-report-table-wrapper">
              <table className="lm-report-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Total Calls</th>
                    <th>Answered</th>
                    <th>Customers</th>
                    <th>Visits</th>
                    <th>Completed</th>
                    <th>Cancelled</th>
                  </tr>
                </thead>

                <tbody>
                  {employeeRows.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="lm-report-empty-cell">
                        No employee performance data available.
                      </td>
                    </tr>
                  ) : (
                    employeeRows.map((item) => (
                      <tr key={item.employee.id}>
                        <td>
                          <div className="lm-report-employee">
                            <strong>{item.employee.name}</strong>
                            <span>{item.employee.email}</span>
                          </div>
                        </td>

                        <td>
                          {formatRole(item.employee.role)}
                        </td>

                        <td>
                          <span
                            className={`lm-report-status ${
                              item.employee.isActive
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            {item.employee.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>{item.calls?.total || 0}</td>
                        <td>{item.calls?.answered || 0}</td>
                        <td>{item.customers?.totalAssigned || 0}</td>
                        <td>{item.visits?.total || 0}</td>
                        <td>{item.visits?.completed || 0}</td>
                        <td>{item.visits?.cancelled || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Employee-wise customer and visit reports */}
          <section className="lm-reports-section">
            <div className="lm-reports-section-heading">
              <div>
                <h2>Employee Allocation & Visit Performance</h2>
                <p>
                  Customer allocation and visit completion by employee
                </p>
              </div>
            </div>

            <div className="lm-reports-two-column">
              <section className="lm-report-panel">
                <div className="lm-report-panel-heading">
                  <div>
                    <h2>Customer Allocation</h2>
                    <p>Active customers assigned to employees</p>
                  </div>
                </div>

                {(customerReport?.byEmployee || []).length === 0 ? (
                  <div className="lm-report-no-data">
                    No assigned customers available
                  </div>
                ) : (
                  <div className="lm-report-simple-list">
                    {customerReport.byEmployee.map((item) => (
                      <div
                        className="lm-report-simple-row"
                        key={item.employeeEmail}
                      >
                        <div>
                          <strong>{item.employeeName}</strong>
                          <span>
                            {formatRole(item.employeeRole)}
                          </span>
                        </div>
                        <strong>{item.totalCustomers}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="lm-report-panel">
                <div className="lm-report-panel-heading">
                  <div>
                    <h2>Visit Performance</h2>
                    <p>Employee-wise property visit results</p>
                  </div>
                </div>

                {(visitReport?.byEmployee || []).length === 0 ? (
                  <div className="lm-report-no-data">
                    No visit performance available
                  </div>
                ) : (
                  <div className="lm-report-simple-list">
                    {visitReport.byEmployee.map((item) => (
                      <div
                        className="lm-report-simple-row"
                        key={item.employeeEmail}
                      >
                        <div>
                          <strong>{item.employeeName}</strong>
                          <span>
                            {item.completedVisits} completed of{" "}
                            {item.totalVisits} visits
                          </span>
                        </div>
                        <strong>
                          {calculatePercentage(
                            item.completedVisits,
                            item.totalVisits
                          )}%
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
