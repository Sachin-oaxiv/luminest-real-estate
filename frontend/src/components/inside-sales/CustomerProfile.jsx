
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api.js";
import CallActivityForm from "./CallActivityForm.jsx";
import WhatsAppPanel from "./WhatsAppPanel.jsx";
import CustomerPhoneActions from "../shared/CustomerPhoneActions.jsx";
import VisitScheduler from "./VisitScheduler.jsx";
import "../../styles/pages/customer-profile.css";

const formatLabel = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

const formatDate = (date) => {
  if (!date) return "Not scheduled";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDuration = (seconds = 0) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
};

const getInterestClass = (status) => {
  const classes = {
    interested: "lm-profile-interest-interested",
    not_interested: "lm-profile-interest-not-interested",
    thinking: "lm-profile-interest-thinking",
    callback_requested: "lm-profile-interest-callback",
  };

  return classes[status] || classes.thinking;
};

export default function CustomerProfile({ customer, onBack }) {
  const [activities, setActivities] = useState([]);
  const [profileCustomer, setProfileCustomer] = useState(customer);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCallForm, setShowCallForm] = useState(false);
  const [showVisitScheduler, setShowVisitScheduler] = useState(false);

  const fetchCallHistory = useCallback(async () => {
    if (!customer?._id) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/call-activities/customer/${customer._id}`
      );

      const latestActivities = response.data.activities || [];

      setActivities(latestActivities);

      if (latestActivities.length > 0) {
        const latestCall = latestActivities[0];

        setProfileCustomer((previous) => ({
          ...previous,
          interestStatus:
            latestCall.interestStatus || previous.interestStatus,
          followUpDate:
            latestCall.followUpDate ?? previous.followUpDate,
        }));
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load customer call history."
      );
    } finally {
      setLoading(false);
    }
  }, [customer?._id]);

  useEffect(() => {
    setProfileCustomer(customer);
  }, [customer]);

  useEffect(() => {
    fetchCallHistory();
  }, [fetchCallHistory]);

  if (!profileCustomer) return null;

  const interestStatus =
    profileCustomer.interestStatus || "thinking";

  return (
    <main className="lm-customer-profile">
      <header className="lm-profile-header">
        <button
          type="button"
          className="lm-profile-back"
          onClick={onBack}
        >
          ← Back to Customers
        </button>

        <span>LUMINEST · CUSTOMER PROFILE</span>

        <h1>{profileCustomer.name}</h1>

        <p>
          Review customer information and track your communication history.
        </p>
      </header>

      <section className="lm-profile-card">
        <div className="lm-profile-card-heading">
          <div>
            <h2>Customer Information</h2>
            <p>Latest customer interest and follow-up details.</p>
          </div>

          <span
            className={`lm-profile-status ${getInterestClass(
              interestStatus
            )}`}
          >
            {formatLabel(interestStatus)}
          </span>
        </div>

        <div className="lm-profile-grid">
          <div>
            <span>Phone Number</span>
            <strong><CustomerPhoneActions phone={profileCustomer.phone} /></strong>
          </div>

          <div>
            <span>Email Address</span>
            <strong>{profileCustomer.email || "Not provided"}</strong>
          </div>

          <div>
            <span>Interested Property</span>
            <strong>
              {profileCustomer.interestedProperty || "Not specified"}
            </strong>
          </div>

          <div>
            <span>Preferred Location</span>
            <strong>
              {profileCustomer.preferredLocation || "Not specified"}
            </strong>
          </div>

          <div>
            <span>Minimum Budget</span>
            <strong>
              {profileCustomer.budgetMin
                ? `₹${Number(profileCustomer.budgetMin).toLocaleString("en-IN")}`
                : "Not specified"}
            </strong>
          </div>

          <div>
            <span>Maximum Budget</span>
            <strong>
              {profileCustomer.budgetMax
                ? `₹${Number(profileCustomer.budgetMax).toLocaleString("en-IN")}`
                : "Not specified"}
            </strong>
          </div>

          <div>
            <span>Customer Status</span>
            <strong>
              {formatLabel(profileCustomer.status || "new")}
            </strong>
          </div>

          <div>
            <span>Next Follow-up</span>
            <strong>
              {formatDate(profileCustomer.followUpDate)}
            </strong>
          </div>

          <div className="lm-profile-notes">
            <span>Customer Notes</span>
            <p>
              {profileCustomer.notes || "No additional notes available."}
            </p>
          </div>
        </div>
      </section>

      <section className="lm-profile-call-section">
        <div className="lm-profile-action-buttons">
          {!showCallForm && (
            <button
              type="button"
              className="lm-profile-record-call"
              onClick={() => {
                setShowVisitScheduler(false);
                setShowCallForm(true);
              }}
            >
              + Record New Call
            </button>
          )}

          {!showVisitScheduler && (
            <button
              type="button"
              className="lm-profile-record-call lm-profile-schedule-visit"
              onClick={() => {
                setShowCallForm(false);
                setShowVisitScheduler(true);
              }}
            >
              + Schedule Property Visit
            </button>
          )}
        </div>

        {showCallForm && (
          <CallActivityForm
            customer={profileCustomer}
            onCancel={() => setShowCallForm(false)}
            onSuccess={async () => {
              await fetchCallHistory();
              setShowCallForm(false);
            }}
          />
        )}

        {showVisitScheduler && (
          <VisitScheduler
            customer={profileCustomer}
            onClose={() => setShowVisitScheduler(false)}
            onSuccess={() => {
              setProfileCustomer((previous) => ({
                ...previous,
                status: "visit_scheduled",
              }));

              setShowVisitScheduler(false);
            }}
          />
        )}
      </section>

      <section className="lm-profile-card">
        <div className="lm-profile-card-heading">
          <div>
            <h2>Call History</h2>
            <p>Previous communication with this customer.</p>
          </div>

          <button
            type="button"
            className="lm-profile-refresh"
            onClick={fetchCallHistory}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="lm-profile-state">
            Loading call history...
          </div>
        ) : error ? (
          <div className="lm-profile-error">
            <p>{error}</p>
            <button type="button" onClick={fetchCallHistory}>
              Try Again
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="lm-profile-state">
            <span>◎</span>
            <h3>No calls recorded yet</h3>
            <p>
              Your recorded customer calls will appear here.
            </p>
          </div>
        ) : (
          <div className="lm-profile-timeline">
            {activities.map((activity) => (
              <article
                className="lm-profile-timeline-item"
                key={activity._id}
              >
                <div className="lm-profile-timeline-dot" />

                <div className="lm-profile-timeline-content">
                  <div className="lm-profile-timeline-heading">
                    <strong>
                      {formatLabel(activity.callStatus)}
                    </strong>

                    <span>{formatDate(activity.callDate)}</span>
                  </div>

                  <div className="lm-profile-call-meta">
                    <span>
                      Duration: {formatDuration(activity.duration)}
                    </span>

                    <span>
                      Interest: {formatLabel(activity.interestStatus)}
                    </span>
                  </div>

                  {activity.notes && <p>{activity.notes}</p>}

                  {activity.followUpDate && (
                    <span className="lm-profile-followup">
                      Follow-up: {formatDate(activity.followUpDate)}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <WhatsAppPanel customer={profileCustomer} />
    </main>
  );
}
