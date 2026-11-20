
import CustomerPhoneActions from "../shared/CustomerPhoneActions.jsx";

const formatLabel = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

const formatDateTime = (value) => {
  if (!value) return "Date not available";

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
    scheduled: "lm-visit-status-scheduled",
    confirmed: "lm-visit-status-confirmed",
    rescheduled: "lm-visit-status-rescheduled",
    in_progress: "lm-visit-status-progress",
    completed: "lm-visit-status-completed",
    cancelled: "lm-visit-status-cancelled",
  };

  return classes[status] || classes.scheduled;
};

export default function VisitCard({ visit, onView }) {
  if (!visit) return null;

  return (
    <article className="lm-outside-visit-card">
      <div className="lm-outside-visit-card-top">
        <div className="lm-outside-visit-customer">
          <div className="lm-outside-visit-avatar">
            {visit.customer?.name?.charAt(0)?.toUpperCase() || "C"}
          </div>

          <div>
            <span className="lm-outside-visit-label">CUSTOMER</span>
            <h3>{visit.customer?.name || "Customer"}</h3>
            <p><CustomerPhoneActions phone={visit.customer?.phone} /></p>
          </div>
        </div>

        <span
          className={`lm-outside-visit-status ${getStatusClass(
            visit.status
          )}`}
        >
          {formatLabel(visit.status || "scheduled")}
        </span>
      </div>

      <div className="lm-outside-visit-property">
        <span className="lm-outside-visit-label">PROPERTY</span>
        <strong>{visit.propertyName || "Property not specified"}</strong>
        <p>{visit.propertyAddress || "Address not available"}</p>
      </div>

      <div className="lm-outside-visit-meta">
        <div>
          <span>Scheduled Date & Time</span>
          <strong>{formatDateTime(visit.scheduledDate)}</strong>
        </div>

        <div>
          <span>Scheduled By</span>
          <strong>{visit.scheduledBy?.name || "Inside Sales"}</strong>
        </div>
      </div>

      {visit.notes && (
        <div className="lm-outside-visit-notes">
          <span>VISIT INSTRUCTIONS</span>
          <p>{visit.notes}</p>
        </div>
      )}

      <div className="lm-outside-visit-card-footer">
        <button
          type="button"
          className="lm-outside-visit-view-button"
          onClick={() => onView?.(visit)}
        >
          View Visit Details →
        </button>
      </div>
    </article>
  );
}
