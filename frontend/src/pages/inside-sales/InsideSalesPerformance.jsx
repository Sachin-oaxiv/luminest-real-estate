
import { useCallback, useEffect, useMemo, useState } from "react";
import insideSalesPerformanceService from "../../services/insideSalesPerformanceService.js";
import "../../styles/pages/inside-sales-performance.css";

const formatLabel = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const InsideSalesPerformance = () => {
  const [data, setData] = useState({
    customers: [],
    calls: [],
    followUps: [],
    visits: [],
    messages: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPerformance = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result =
        await insideSalesPerformanceService.getInsideSalesPerformance();

      setData(result);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your performance data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  const metrics = useMemo(() => {
    const { customers, calls, followUps, visits, messages } = data;

    const answeredCalls = calls.filter(
      (call) => call.callStatus === "answered"
    ).length;

    const interested = customers.filter(
      (customer) => customer.interestStatus === "interested"
    ).length;

    const callbacks = customers.filter(
      (customer) => customer.interestStatus === "callback_requested"
    ).length;

    const completedVisits = visits.filter(
      (visit) => visit.status === "completed"
    ).length;

    const scheduledVisits = visits.filter(
      (visit) =>
        ["scheduled", "confirmed", "rescheduled"].includes(visit.status)
    ).length;

    const readMessages = messages.filter(
      (message) => message.deliveryStatus === "read"
    ).length;

    return {
      totalCustomers: customers.length,
      totalCalls: calls.length,
      answeredCalls,
      interested,
      callbacks,
      totalFollowUps: followUps.length,
      scheduledVisits,
      completedVisits,
      totalVisits: visits.length,
      totalMessages: messages.length,
      readMessages,
    };
  }, [data]);

  const callRate = metrics.totalCalls
    ? Math.round((metrics.answeredCalls / metrics.totalCalls) * 100)
    : 0;

  const visitCompletionRate = metrics.totalVisits
    ? Math.round((metrics.completedVisits / metrics.totalVisits) * 100)
    : 0;

  const messageReadRate = metrics.totalMessages
    ? Math.round((metrics.readMessages / metrics.totalMessages) * 100)
    : 0;

  const recentCalls = [...data.calls]
    .sort(
      (a, b) =>
        new Date(b.callDate || b.createdAt) -
        new Date(a.callDate || a.createdAt)
    )
    .slice(0, 5);

  const recentVisits = [...data.visits]
    .sort(
      (a, b) =>
        new Date(b.scheduledDate || b.createdAt) -
        new Date(a.scheduledDate || a.createdAt)
    )
    .slice(0, 5);

  if (loading) {
    return (
      <main className="lm-is-performance">
        <div className="lm-is-performance-state">
          Loading your performance dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="lm-is-performance">
      <header className="lm-is-performance-header">
        <div>
          <span className="lm-is-performance-eyebrow">
            LUMINEST · PERFORMANCE ANALYTICS
          </span>

          <h1>My Performance</h1>

          <p>
            Track your customer engagement, communication,
            follow-ups and property visit activity.
          </p>
        </div>

        <button
          type="button"
          className="lm-is-performance-refresh"
          onClick={fetchPerformance}
          disabled={loading}
        >
          ↻ Refresh Data
        </button>
      </header>

      {error && (
        <div className="lm-is-performance-error">
          <p>{error}</p>
          <button type="button" onClick={fetchPerformance}>
            Try Again
          </button>
        </div>
      )}

      <section className="lm-is-performance-section">
        <div className="lm-is-performance-section-heading">
          <div>
            <h2>Performance Overview</h2>
            <p>Your current activity totals across available records.</p>
          </div>
        </div>

        <div className="lm-is-performance-stats">
          <article className="lm-is-performance-stat">
            <span>Assigned Customers</span>
            <strong>{metrics.totalCustomers}</strong>
            <small>Active assigned customers</small>
          </article>

          <article className="lm-is-performance-stat">
            <span>Total Calls</span>
            <strong>{metrics.totalCalls}</strong>
            <small>{metrics.answeredCalls} answered calls</small>
          </article>

          <article className="lm-is-performance-stat">
            <span>Interested Leads</span>
            <strong>{metrics.interested}</strong>
            <small>{metrics.callbacks} callback requests</small>
          </article>

          <article className="lm-is-performance-stat">
            <span>Follow-ups</span>
            <strong>{metrics.totalFollowUps}</strong>
            <small>Customers with follow-up dates</small>
          </article>

          <article className="lm-is-performance-stat">
            <span>Property Visits</span>
            <strong>{metrics.totalVisits}</strong>
            <small>
              {metrics.completedVisits} completed
            </small>
          </article>

          <article className="lm-is-performance-stat">
            <span>WhatsApp Messages</span>
            <strong>{metrics.totalMessages}</strong>
            <small>{metrics.readMessages} read messages</small>
          </article>
        </div>
      </section>

      <section className="lm-is-performance-section">
        <div className="lm-is-performance-section-heading">
          <div>
            <h2>Activity Performance</h2>
            <p>Progress indicators calculated from your available records.</p>
          </div>
        </div>

        <div className="lm-is-performance-rates">
          <article className="lm-is-performance-rate">
            <div>
              <span>Call Answer Rate</span>
              <strong>{callRate}%</strong>
            </div>

            <div className="lm-is-performance-progress">
              <span style={{ width: `${callRate}%` }} />
            </div>

            <small>
              {metrics.answeredCalls} answered out of {metrics.totalCalls} calls
            </small>
          </article>

          <article className="lm-is-performance-rate">
            <div>
              <span>Visit Completion Rate</span>
              <strong>{visitCompletionRate}%</strong>
            </div>

            <div className="lm-is-performance-progress">
              <span style={{ width: `${visitCompletionRate}%` }} />
            </div>

            <small>
              {metrics.completedVisits} completed out of {metrics.totalVisits} visits
            </small>
          </article>

          <article className="lm-is-performance-rate">
            <div>
              <span>WhatsApp Read Rate</span>
              <strong>{messageReadRate}%</strong>
            </div>

            <div className="lm-is-performance-progress">
              <span style={{ width: `${messageReadRate}%` }} />
            </div>

            <small>
              {metrics.readMessages} read out of {metrics.totalMessages} messages
            </small>
          </article>
        </div>
      </section>

      <section className="lm-is-performance-section">
        <div className="lm-is-performance-section-heading">
          <div>
            <h2>Lead Interest Breakdown</h2>
            <p>Interest statuses across your assigned customers.</p>
          </div>
        </div>

        <div className="lm-is-performance-interest">
          {[
            {
              label: "Interested",
              value: metrics.interested,
              className: "interested",
            },
            {
              label: "Callback Requested",
              value: metrics.callbacks,
              className: "callback",
            },
            {
              label: "Thinking",
              value: data.customers.filter(
                (customer) => customer.interestStatus === "thinking"
              ).length,
              className: "thinking",
            },
            {
              label: "Not Interested",
              value: data.customers.filter(
                (customer) => customer.interestStatus === "not_interested"
              ).length,
              className: "not-interested",
            },
          ].map((item) => (
            <article
              className="lm-is-performance-interest-card"
              key={item.className}
            >
              <span className={`lm-is-interest-dot ${item.className}`} />
              <div>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="lm-is-performance-section">
        <div className="lm-is-performance-section-heading">
          <div>
            <h2>Recent Call Activities</h2>
            <p>Your latest five recorded customer calls.</p>
          </div>
        </div>

        {recentCalls.length === 0 ? (
          <div className="lm-is-performance-empty">
            No call activities recorded yet.
          </div>
        ) : (
          <div className="lm-is-performance-table-wrap">
            <table className="lm-is-performance-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Call Date</th>
                  <th>Call Outcome</th>
                  <th>Interest</th>
                  <th>Follow-up</th>
                </tr>
              </thead>

              <tbody>
                {recentCalls.map((call) => (
                  <tr key={call._id}>
                    <td>
                      <strong>
                        {call.customer?.name || "Unknown Customer"}
                      </strong>
                    </td>

                    <td>{formatDate(call.callDate || call.createdAt)}</td>

                    <td>{formatLabel(call.callStatus || "")}</td>

                    <td>{formatLabel(call.interestStatus || "")}</td>

                    <td>{formatDate(call.followUpDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="lm-is-performance-section">
        <div className="lm-is-performance-section-heading">
          <div>
            <h2>Recent Property Visits</h2>
            <p>Your latest five scheduled property visits.</p>
          </div>
        </div>

        {recentVisits.length === 0 ? (
          <div className="lm-is-performance-empty">
            No property visits found yet.
          </div>
        ) : (
          <div className="lm-is-performance-table-wrap">
            <table className="lm-is-performance-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Property</th>
                  <th>Scheduled Date</th>
                  <th>Assigned Employee</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentVisits.map((visit) => (
                  <tr key={visit._id}>
                    <td>
                      <strong>
                        {visit.customer?.name || "Unknown Customer"}
                      </strong>
                    </td>

                    <td>{visit.propertyName || "—"}</td>

                    <td>{formatDate(visit.scheduledDate)}</td>

                    <td>
                      {visit.assignedTo?.name || "Not assigned"}
                    </td>

                    <td>
                      <span className="lm-is-performance-status">
                        {formatLabel(visit.status || "")}
                      </span>
                    </td>
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

export default InsideSalesPerformance;
