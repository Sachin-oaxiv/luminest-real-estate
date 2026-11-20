
import { useCallback, useEffect, useMemo, useState } from "react";
import callActivityService from "../../services/callActivityService.js";
import "../../styles/pages/call-activities.css";

const callStatusLabels = {
  answered: "Answered",
  not_answered: "Not Answered",
  busy: "Busy",
  switched_off: "Switched Off",
  invalid_number: "Invalid Number",
};

const interestLabels = {
  interested: "Interested",
  not_interested: "Not Interested",
  thinking: "Thinking",
  callback_requested: "Callback Requested",
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (seconds = 0) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
};

const CallActivities = () => {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [interestFilter, setInterestFilter] = useState("all");
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await callActivityService.getMyCallActivities();
      setActivities(result.activities || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your call activities."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const stats = useMemo(() => {
    return {
      total: activities.length,
      answered: activities.filter(
        (item) => item.callStatus === "answered"
      ).length,
      interested: activities.filter(
        (item) => item.interestStatus === "interested"
      ).length,
      callbacks: activities.filter(
        (item) => item.interestStatus === "callback_requested"
      ).length,
    };
  }, [activities]);

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return activities.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.customer?.name,
          item.customer?.phone,
          item.customer?.email,
          item.notes,
        ].some((value) => value?.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "all" ||
        item.callStatus === statusFilter;

      const matchesInterest =
        interestFilter === "all" ||
        item.interestStatus === interestFilter;

      return matchesSearch && matchesStatus && matchesInterest;
    });
  }, [activities, search, statusFilter, interestFilter]);

  return (
    <main className="lm-call-activities">
      <header className="lm-call-activities-header">
        <div>
          <span className="lm-call-activities-eyebrow">
            INSIDE SALES / CALL MANAGEMENT
          </span>
          <h1>Call Activities</h1>
          <p>
            Track your customer conversations, call outcomes and
            follow-up commitments.
          </p>
        </div>

        <button
          type="button"
          className="lm-call-refresh"
          onClick={fetchActivities}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </header>

      <section className="lm-call-stats">
        <article className="lm-call-stat">
          <span>Total Calls</span>
          <strong>{stats.total}</strong>
          <small>All recorded calls</small>
        </article>

        <article className="lm-call-stat">
          <span>Answered Calls</span>
          <strong>{stats.answered}</strong>
          <small>Successfully connected</small>
        </article>

        <article className="lm-call-stat">
          <span>Interested Customers</span>
          <strong>{stats.interested}</strong>
          <small>Positive interest recorded</small>
        </article>

        <article className="lm-call-stat">
          <span>Callback Requests</span>
          <strong>{stats.callbacks}</strong>
          <small>Customers requesting callbacks</small>
        </article>
      </section>

      <section className="lm-call-content">
        <div className="lm-call-toolbar">
          <input
            type="search"
            placeholder="Search customer, phone, email or notes..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Call Outcomes</option>
            {Object.entries(callStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={interestFilter}
            onChange={(event) => setInterestFilter(event.target.value)}
          >
            <option value="all">All Interest Statuses</option>
            {Object.entries(interestLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="lm-call-table-heading">
          <div>
            <h2>Call History</h2>
            <p>{filteredActivities.length} activities found</p>
          </div>
        </div>

        {error && (
          <div className="lm-call-error">
            {error}
            <button type="button" onClick={fetchActivities}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="lm-call-state">Loading call activities...</div>
        ) : !error && filteredActivities.length === 0 ? (
          <div className="lm-call-state">
            <h3>No call activities found</h3>
            <p>
              Your recorded customer calls will appear here.
              Try adjusting your filters.
            </p>
          </div>
        ) : (
          !error && (
            <div className="lm-call-table-wrap">
              <table className="lm-call-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Call Date</th>
                    <th>Call Outcome</th>
                    <th>Duration</th>
                    <th>Interest Status</th>
                    <th>Follow-up</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredActivities.map((activity) => (
                    <tr key={activity._id}>
                      <td>
                        <div className="lm-call-customer">
                          <strong>
                            {activity.customer?.name || "Unknown"}
                          </strong>
                          <span>
                            {activity.customer?.phone || "—"}
                          </span>
                        </div>
                      </td>

                      <td>{formatDate(activity.callDate)}</td>

                      <td>
                        <span
                          className={`lm-call-status lm-call-status-${activity.callStatus}`}
                        >
                          {callStatusLabels[activity.callStatus] ||
                            activity.callStatus}
                        </span>
                      </td>

                      <td>{formatDuration(activity.duration)}</td>

                      <td>
                        <span
                          className={`lm-call-interest lm-call-interest-${activity.interestStatus}`}
                        >
                          {interestLabels[activity.interestStatus] ||
                            activity.interestStatus ||
                            "—"}
                        </span>
                      </td>

                      <td>{formatDate(activity.followUpDate)}</td>

                      <td>
                        <button
                          type="button"
                          className="lm-call-view-button"
                          onClick={() => setSelectedActivity(activity)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </section>

      {selectedActivity && (
        <div
          className="lm-call-modal-overlay"
          onClick={() => setSelectedActivity(null)}
        >
          <section
            className="lm-call-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="lm-call-modal-header">
              <div>
                <span>CALL ACTIVITY DETAILS</span>
                <h2>{selectedActivity.customer?.name || "Customer"}</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
              >
                ×
              </button>
            </header>

            <div className="lm-call-modal-body">
              <div className="lm-call-detail-grid">
                <div>
                  <span>Customer Phone</span>
                  <strong>
                    {selectedActivity.customer?.phone || "—"}
                  </strong>
                </div>

                <div>
                  <span>Customer Email</span>
                  <strong>
                    {selectedActivity.customer?.email || "—"}
                  </strong>
                </div>

                <div>
                  <span>Call Date</span>
                  <strong>{formatDate(selectedActivity.callDate)}</strong>
                </div>

                <div>
                  <span>Call Outcome</span>
                  <strong>
                    {callStatusLabels[selectedActivity.callStatus] ||
                      selectedActivity.callStatus}
                  </strong>
                </div>

                <div>
                  <span>Call Duration</span>
                  <strong>
                    {formatDuration(selectedActivity.duration)}
                  </strong>
                </div>

                <div>
                  <span>Interest Status</span>
                  <strong>
                    {interestLabels[selectedActivity.interestStatus] ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Follow-up Date</span>
                  <strong>
                    {formatDate(selectedActivity.followUpDate)}
                  </strong>
                </div>
              </div>

              <div className="lm-call-notes">
                <span>Call Notes</span>
                <p>
                  {selectedActivity.notes || "No notes recorded."}
                </p>
              </div>
            </div>

            <footer className="lm-call-modal-footer">
              <button
                type="button"
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
};

export default CallActivities;
