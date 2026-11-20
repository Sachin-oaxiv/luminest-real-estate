
import { useCallback, useEffect, useMemo, useState } from "react";

import activityService from "../../services/activityService.js";
import employeeService from "../../services/employeeService.js";
import customerService from "../../services/customerService.js";
import CustomSelect from "../../components/common/CustomSelect.jsx";

const formatLabel = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getId = (value) =>
  typeof value === "object" && value !== null
    ? value._id || value.id
    : value;

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (seconds) => {
  if (seconds === undefined || seconds === null) return "—";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
};

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedActivity, setSelectedActivity] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [activityData, employeeData, customerData] =
        await Promise.all([
          activityService.getAllActivities({
            type: typeFilter,
            employeeId: employeeFilter === "all" ? "" : employeeFilter,
            customerId: customerFilter === "all" ? "" : customerFilter,
            from: fromDate,
            to: toDate,
          }),
          employeeService.getAllEmployees(),
          customerService.getAllCustomers(),
        ]);

      setActivities(activityData.activities || []);
      setEmployees(employeeData || []);
      setCustomers(customerData || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load activity information."
      );
    } finally {
      setLoading(false);
    }
  }, [
    typeFilter,
    employeeFilter,
    customerFilter,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredActivities = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return activities.filter((activity) => {
      const searchableText = [
        activity.customer?.name,
        activity.customer?.phone,
        activity.employee?.name,
        activity.title,
        activity.description,
        activity.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [activities, search]);

  const totalCount = activities.length;

  const callCount = activities.filter(
    (activity) => activity.type === "call"
  ).length;

  const messageCount = activities.filter(
    (activity) => activity.type === "message"
  ).length;

  const visitCount = activities.filter(
    (activity) => activity.type === "visit"
  ).length;

  const employeeOptions = [
    { value: "all", label: "All Employees" },
    ...employees.map((employee) => ({
      value: getId(employee),
      label: `${employee.name} (${formatLabel(employee.role)})`,
    })),
  ];

  const customerOptions = [
    { value: "all", label: "All Customers" },
    ...customers.map((customer) => ({
      value: getId(customer),
      label: customer.name,
    })),
  ];

  const typeOptions = [
    { value: "all", label: "All Activities" },
    { value: "call", label: "Calls" },
    { value: "message", label: "WhatsApp Messages" },
    { value: "visit", label: "Property Visits" },
  ];

  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setEmployeeFilter("all");
    setCustomerFilter("all");
    setFromDate("");
    setToDate("");
  };

  if (loading) {
    return (
      <main className="admin-page activity-management-page">
        <div className="admin-page-loading">
          Loading activity information...
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page activity-management-page">

      {/* Page Header */}
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">CUSTOMER ENGAGEMENT</p>
          <h1>Activities Management</h1>
          <p>
            Monitor customer calls, WhatsApp communication and
            property visits across your sales team.
          </p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={fetchData}
        >
          ↻ Refresh Activities
        </button>
      </header>

      {/* Error */}
      {error && (
        <div className="admin-alert admin-alert-error">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <section className="announcement-stats activity-stats">

        <article>
          <span>Total Activities</span>
          <strong>{totalCount}</strong>
          <small>Matching activity records</small>
        </article>

        <article>
          <span>Customer Calls</span>
          <strong>{callCount}</strong>
          <small>Recorded phone interactions</small>
        </article>

        <article>
          <span>WhatsApp Messages</span>
          <strong>{messageCount}</strong>
          <small>Customer communication records</small>
        </article>

        <article>
          <span>Property Visits</span>
          <strong>{visitCount}</strong>
          <small>Scheduled visit records</small>
        </article>

      </section>

      {/* Activity Table */}
      <section className="announcement-management-card">

        <div className="announcement-toolbar">
          <div>
            <h2>Activity History</h2>
            <p>
              View and monitor all recorded customer interactions.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="activity-filter-panel">

          <input
            type="search"
            placeholder="Search customer, employee or activity..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <CustomSelect
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="All Activities"
            options={typeOptions}
          />

          <CustomSelect
            value={employeeFilter}
            onChange={setEmployeeFilter}
            placeholder="All Employees"
            options={employeeOptions}
          />

          <CustomSelect
            value={customerFilter}
            onChange={setCustomerFilter}
            placeholder="All Customers"
            options={customerOptions}
          />

          <div className="activity-date-filter">
            <label htmlFor="activity-from-date">From</label>
            <input
              id="activity-from-date"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </div>

          <div className="activity-date-filter">
            <label htmlFor="activity-to-date">To</label>
            <input
              id="activity-to-date"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
            />
          </div>

          <button
            type="button"
            className="admin-secondary-button"
            onClick={handleResetFilters}
          >
            Reset
          </button>

        </div>

        {/* Results */}
        <div className="activity-results-heading">
          <span>
            Showing {filteredActivities.length} of {totalCount} activities
          </span>
        </div>

        <div className="announcement-table-wrapper">
          <table className="announcement-table activity-table">

            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Activity</th>
                <th>Customer</th>
                <th>Employee</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan="6" className="announcement-empty">
                    No activity records found.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity) => (
                  <tr key={`${activity.type}-${activity.id}`}>

                    <td>
                      <strong>{formatDate(activity.date)}</strong>
                    </td>

                    <td>
                      <span
                        className={`activity-type-badge activity-type-${activity.type}`}
                      >
                        {formatLabel(activity.type)}
                      </span>
                      <small className="activity-table-subtitle">
                        {activity.title}
                      </small>
                    </td>

                    <td>
                      <strong>
                        {activity.customer?.name || "—"}
                      </strong>
                      <small className="activity-table-subtitle">
                        {activity.customer?.phone || ""}
                      </small>
                    </td>

                    <td>
                      <strong>
                        {activity.employee?.name || "—"}
                      </strong>
                      <small className="activity-table-subtitle">
                        {formatLabel(activity.employee?.role || "")}
                      </small>
                    </td>

                    <td>
                      <span className="announcement-status pending">
                        {formatLabel(activity.status || "Unknown")}
                      </span>
                    </td>

                    <td>
                      <div className="announcement-actions">
                        <button
                          type="button"
                          onClick={() => setSelectedActivity(activity)}
                        >
                          View Details
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>

      </section>

      {/* Activity Details */}
      {selectedActivity && (
        <div
          className="activity-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedActivity(null);
            }
          }}
        >
          <section
            className="activity-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-modal-title"
          >

            <header className="activity-modal-header">
              <div>
                <p className="admin-eyebrow">ACTIVITY DETAILS</p>
                <h2 id="activity-modal-title">
                  {selectedActivity.title}
                </h2>
              </div>

              <button
                type="button"
                className="activity-modal-close"
                onClick={() => setSelectedActivity(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </header>

            <div className="activity-details-content">

              <div className="activity-detail-grid">

                <div>
                  <span>Activity Type</span>
                  <strong>
                    {formatLabel(selectedActivity.type)}
                  </strong>
                </div>

                <div>
                  <span>Date & Time</span>
                  <strong>{formatDate(selectedActivity.date)}</strong>
                </div>

                <div>
                  <span>Customer</span>
                  <strong>
                    {selectedActivity.customer?.name || "—"}
                  </strong>
                </div>

                <div>
                  <span>Customer Phone</span>
                  <strong>
                    {selectedActivity.customer?.phone || "—"}
                  </strong>
                </div>

                <div>
                  <span>Employee</span>
                  <strong>
                    {selectedActivity.employee?.name || "—"}
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>
                    {formatLabel(selectedActivity.status || "Unknown")}
                  </strong>
                </div>

              </div>

              {selectedActivity.description && (
                <div className="activity-detail-description">
                  <span>Description / Notes</span>
                  <p>{selectedActivity.description}</p>
                </div>
              )}

              {/* Call Details */}
              {selectedActivity.type === "call" && (
                <div className="activity-detail-section">
                  <h3>Call Information</h3>

                  <div className="activity-detail-grid">
                    <div>
                      <span>Call Duration</span>
                      <strong>
                        {formatDuration(selectedActivity.details?.duration)}
                      </strong>
                    </div>

                    <div>
                      <span>Interest Status</span>
                      <strong>
                        {formatLabel(
                          selectedActivity.details?.interestStatus || "—"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Follow-up Date</span>
                      <strong>
                        {formatDate(
                          selectedActivity.details?.followUpDate
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Details */}
              {selectedActivity.type === "message" && (
                <div className="activity-detail-section">
                  <h3>Message Information</h3>

                  <div className="activity-detail-grid">
                    <div>
                      <span>Channel</span>
                      <strong>
                        {formatLabel(
                          selectedActivity.details?.channel || "—"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Message Type</span>
                      <strong>
                        {formatLabel(
                          selectedActivity.details?.messageType || "—"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Sent At</span>
                      <strong>
                        {formatDate(selectedActivity.details?.sentAt)}
                      </strong>
                    </div>

                    <div>
                      <span>Delivered At</span>
                      <strong>
                        {formatDate(selectedActivity.details?.deliveredAt)}
                      </strong>
                    </div>

                    <div>
                      <span>Read At</span>
                      <strong>
                        {formatDate(selectedActivity.details?.readAt)}
                      </strong>
                    </div>
                  </div>

                  {selectedActivity.details?.failureReason && (
                    <p>
                      Failure reason: {selectedActivity.details.failureReason}
                    </p>
                  )}
                </div>
              )}

              {/* Visit Details */}
              {selectedActivity.type === "visit" && (
                <div className="activity-detail-section">
                  <h3>Property Visit Information</h3>

                  <div className="activity-detail-grid">
                    <div>
                      <span>Visit Outcome</span>
                      <strong>
                        {formatLabel(
                          selectedActivity.details?.visitOutcome || "—"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Arrival Time</span>
                      <strong>
                        {formatDate(
                          selectedActivity.details?.actualArrivalTime
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Completion Time</span>
                      <strong>
                        {formatDate(
                          selectedActivity.details?.actualCompletionTime
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Departure Time</span>
                      <strong>
                        {formatDate(
                          selectedActivity.details?.actualDepartureTime
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Arrival Latitude</span>
                      <strong>
                        {selectedActivity.details?.arrivalLatitude ?? "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Arrival Longitude</span>
                      <strong>
                        {selectedActivity.details?.arrivalLongitude ?? "—"}
                      </strong>
                    </div>
                  </div>

                  {selectedActivity.details?.visitFeedback && (
                    <div className="activity-detail-description">
                      <span>Visit Feedback</span>
                      <p>
                        {selectedActivity.details.visitFeedback}
                      </p>
                    </div>
                  )}

                  {selectedActivity.details?.notes && (
                    <div className="activity-detail-description">
                      <span>Visit Notes</span>
                      <p>{selectedActivity.details.notes}</p>
                    </div>
                  )}

                  <div className="activity-evidence-section">
                    <h3>
                      Visit Evidence (
                      {selectedActivity.details?.evidence?.length || 0})
                    </h3>

                    {selectedActivity.details?.evidence?.length ? (
                      <div className="activity-evidence-grid">
                        {selectedActivity.details.evidence.map((evidence) => (
                          <article key={evidence._id}>
                            {evidence.mimeType?.startsWith("image/") ? (
                              <a
                                href={evidence.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={evidence.fileUrl}
                                  alt={evidence.description || evidence.fileName}
                                />
                              </a>
                            ) : (
                              <a
                                href={evidence.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View uploaded file
                              </a>
                            )}

                            <strong>
                              {evidence.description || evidence.fileName}
                            </strong>

                            <small>
                              Uploaded by:{" "}
                              {evidence.uploadedBy?.name || "Unknown"}
                            </small>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p>No evidence uploaded for this visit.</p>
                    )}
                  </div>

                </div>
              )}

            </div>

            <footer className="activity-modal-footer">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setSelectedActivity(null)}
              >
                Close
              </button>
            </footer>

          </section>
        </div>
      )}

    </main>
  );
}
