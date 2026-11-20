
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api.js";
import "../../styles/pages/my-visits.css";

const formatLabel = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

const formatDateTime = (value) => {
  if (!value) return "Not available";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusClass = (status = "") => {
  const classes = {
    scheduled: "scheduled",
    confirmed: "confirmed",
    rescheduled: "rescheduled",
    in_progress: "progress",
    completed: "completed",
    cancelled: "cancelled",
    no_show: "cancelled",
  };

  return classes[status] || "scheduled";
};

export default function MyVisits() {
  const [visits, setVisits] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/visits/my-created");

      setVisits(response.data.visits || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your scheduled visits."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const counts = useMemo(() => ({
    total: visits.length,
    scheduled: visits.filter((v) =>
      ["scheduled", "confirmed", "rescheduled"].includes(v.status)
    ).length,
    progress: visits.filter((v) => v.status === "in_progress").length,
    completed: visits.filter((v) => v.status === "completed").length,
  }), [visits]);

  const filteredVisits = useMemo(() => {
    const query = search.trim().toLowerCase();

    return visits.filter((visit) => {
      const customerName = visit.customer?.name || "";
      const propertyName = visit.propertyName || "";
      const address = visit.propertyAddress || "";
      const employeeName = visit.assignedTo?.name || "";

      const matchesSearch = !query ||
        [customerName, propertyName, address, employeeName]
          .some((value) => value.toLowerCase().includes(query));

      const matchesFilter =
        filter === "all" ||
        (filter === "scheduled" &&
          ["scheduled", "confirmed", "rescheduled"].includes(visit.status)) ||
        visit.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [visits, search, filter]);

  return (
    <main className="lm-my-visits">
      <header className="lm-my-visits-header">
        <div>
          <span className="lm-my-visits-eyebrow">
            LUMINEST · PROPERTY VISITS
          </span>
          <h1>My Scheduled Visits</h1>
          <p>
            Track the property visits you've arranged for your customers.
          </p>
        </div>

        <button
          type="button"
          className="lm-my-visits-refresh"
          onClick={fetchVisits}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </header>

      <section className="lm-my-visits-stats">
        <article className="lm-my-visits-stat">
          <span>Total Visits</span>
          <strong>{counts.total}</strong>
          <small>All arranged visits</small>
        </article>

        <article className="lm-my-visits-stat">
          <span>Scheduled</span>
          <strong>{counts.scheduled}</strong>
          <small>Awaiting completion</small>
        </article>

        <article className="lm-my-visits-stat">
          <span>In Progress</span>
          <strong>{counts.progress}</strong>
          <small>Currently underway</small>
        </article>

        <article className="lm-my-visits-stat">
          <span>Completed</span>
          <strong>{counts.completed}</strong>
          <small>Successfully completed</small>
        </article>
      </section>

      <section className="lm-my-visits-content">
        <div className="lm-my-visits-toolbar">
          <div>
            <h2>Visit Records</h2>
            <p>All property visits created by you.</p>
          </div>

          <div className="lm-my-visits-filters">
            <input
              type="search"
              placeholder="Search customer, property or employee..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All Visits</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="lm-my-visits-state">
            Loading scheduled visits...
          </div>
        ) : error ? (
          <div className="lm-my-visits-error">
            <p>{error}</p>
            <button type="button" onClick={fetchVisits}>
              Try Again
            </button>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="lm-my-visits-empty">
            <span>◎</span>
            <h3>No visits found</h3>
            <p>
              {visits.length === 0
                ? "Property visits you schedule will appear here."
                : "Try changing your search or status filter."}
            </p>
          </div>
        ) : (
          <div className="lm-my-visits-table-wrap">
            <table className="lm-my-visits-table">
              <thead>
                <tr>
                  <th>Customer / Property</th>
                  <th>Visit Date</th>
                  <th>Assigned Employee</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredVisits.map((visit) => (
                  <tr key={visit._id}>
                    <td>
                      <div className="lm-my-visits-customer">
                        <strong>{visit.customer?.name || "Customer"}</strong>
                        <span>{visit.propertyName || "Property"}</span>
                      </div>
                    </td>

                    <td>{formatDateTime(visit.scheduledDate)}</td>

                    <td>
                      {visit.assignedTo?.name || "Not assigned"}
                    </td>

                    <td>
                      <span
                        className={`lm-my-visits-status ${getStatusClass(
                          visit.status
                        )}`}
                      >
                        {formatLabel(visit.status || "scheduled")}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="lm-my-visits-view"
                        onClick={() => setSelectedVisit(visit)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedVisit && (
        <div
          className="lm-my-visits-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedVisit(null);
            }
          }}
        >
          <section
            className="lm-my-visits-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lm-my-visits-modal-title"
          >
            <div className="lm-my-visits-modal-header">
              <div>
                <span>VISIT INFORMATION</span>
                <h2 id="lm-my-visits-modal-title">Visit Details</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVisit(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            <div className="lm-my-visits-detail-grid">
              <div>
                <span>Customer</span>
                <strong>{selectedVisit.customer?.name || "—"}</strong>
              </div>

              <div>
                <span>Customer Phone</span>
                <strong>{selectedVisit.customer?.phone || "—"}</strong>
              </div>

              <div>
                <span>Property</span>
                <strong>{selectedVisit.propertyName || "—"}</strong>
              </div>

              <div>
                <span>Assigned Employee</span>
                <strong>{selectedVisit.assignedTo?.name || "—"}</strong>
              </div>

              <div className="lm-my-visits-detail-full">
                <span>Property Address</span>
                <strong>{selectedVisit.propertyAddress || "—"}</strong>
              </div>

              <div>
                <span>Scheduled Date</span>
                <strong>{formatDateTime(selectedVisit.scheduledDate)}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{formatLabel(selectedVisit.status || "scheduled")}</strong>
              </div>

              <div>
                <span>Created By</span>
                <strong>{selectedVisit.scheduledBy?.name || "You"}</strong>
              </div>

              <div className="lm-my-visits-detail-full">
                <span>Notes</span>
                <strong>{selectedVisit.notes || "No additional notes."}</strong>
              </div>

              {selectedVisit.visitFeedback && (
                <div className="lm-my-visits-detail-full">
                  <span>Visit Feedback</span>
                  <strong>{selectedVisit.visitFeedback}</strong>
                </div>
              )}
            </div>

            <div className="lm-my-visits-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedVisit(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
