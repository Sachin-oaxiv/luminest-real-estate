
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import "../../styles/pages/inside-sales-dashboard.css";

const formatDate = (date) => {
  if (!date) return "Recently posted";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const InsideSalesDashboard = () => {
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/announcements/my");

      setAnnouncements(response.data.announcements || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load company announcements."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return (
    <main className="lm-inside-dashboard">
      <header className="lm-inside-header">
        <div>
          <span className="lm-inside-eyebrow">
            LUMINEST · EMPLOYEE WORKSPACE
          </span>

          <h1>Inside Sales Dashboard</h1>

          <p>
            Welcome back! Here's your workspace for managing customer
            relationships and sales activities.
          </p>
        </div>

        <div className="lm-inside-header-icon">IS</div>
      </header>

      <section className="lm-inside-welcome">
        <div>
          <span>YOUR WORKSPACE</span>
          <h2>Let's make today productive.</h2>
          <p>
            Stay connected with your customers, manage follow-ups and
            keep track of your sales activities.
          </p>
        </div>

        <div className="lm-inside-welcome-mark">L</div>
      </section>

      <section className="lm-inside-section">
        <div className="lm-inside-section-heading">
          <div>
            <h2>My Workspace</h2>
            <p>Your everyday sales tools in one place.</p>
          </div>
        </div>

        <div className="lm-inside-shortcuts">
          {/* 01 - Assigned Customers */}
          <button
            type="button"
            className="lm-inside-shortcut"
            onClick={() => navigate("/inside-sales/customers")}
          >
            <div className="lm-inside-shortcut-icon customers">
              <span>01</span>
            </div>

            <h3>My Assigned Customers</h3>
            <p>View and manage your assigned customer leads.</p>

            <span className="lm-inside-shortcut-label">
              Customer Management
            </span>
          </button>

          {/* 02 - Follow-ups */}
          <button
            type="button"
            className="lm-inside-shortcut"
            onClick={() => navigate("/inside-sales/follow-ups")}
          >
            <div className="lm-inside-shortcut-icon calls">
              <span>02</span>
            </div>

            <h3>My Follow-ups</h3>
            <p>
              Track overdue, today's and upcoming customer follow-ups.
            </p>

            <span className="lm-inside-shortcut-label">
              Follow-up Management
            </span>
          </button>

          {/* 03 - Call Activities */}
          <button
            type="button"
            className="lm-inside-shortcut"
            onClick={() => navigate("/inside-sales/calls")}
          >
            <div className="lm-inside-shortcut-icon calls">
              <span>03</span>
            </div>

            <h3>Call Activities</h3>
            <p>Record customer calls and maintain follow-up notes.</p>

            <span className="lm-inside-shortcut-label">
              Communication
            </span>
          </button>

          {/* 04 - Interest Status */}
          <button
            type="button"
            className="lm-inside-shortcut"
            onClick={() => navigate("/inside-sales/interest-status")}
          >
            <div className="lm-inside-shortcut-icon interest">
              <span>04</span>
            </div>

            <h3>Interest Status</h3>
            <p>Keep customer interest and lead progress updated.</p>

            <span className="lm-inside-shortcut-label">
              Lead Tracking
            </span>
          </button>

         
      {/* 05 - WhatsApp Messages */}
          <button
            type="button"
            className="lm-inside-shortcut"
            onClick={() => navigate("/inside-sales/messages")}
          >
            <div className="lm-inside-shortcut-icon whatsapp">
              <span>05</span>
            </div>

            <h3>WhatsApp Messages</h3>

            <p>Keep track of customer messaging activities.</p>

            <span className="lm-inside-shortcut-label">
              Communication
            </span>
          </button>


          {/* 06 - My Scheduled Visits */}
          <button
            type="button"
            className="lm-inside-shortcut"
            onClick={() => navigate("/inside-sales/visits")}
          >
            <div className="lm-inside-shortcut-icon visits">
              <span>06</span>
            </div>

            <h3>My Scheduled Visits</h3>
            <p>
              View arranged property visits and track their progress.
            </p>

            <span className="lm-inside-shortcut-label">
              Visit Management
            </span>
          </button>

          {/* 07 - Schedule New Visit */}
          <button
            type="button"
            className="lm-inside-shortcut"
            onClick={() => navigate("/inside-sales/customers")}
          >
            <div className="lm-inside-shortcut-icon visits">
              <span>07</span>
            </div>

            <h3>Schedule New Visit</h3>
            <p>
              Choose an assigned customer and arrange a property visit.
            </p>

            <span className="lm-inside-shortcut-label">
              Schedule Visit
            </span>
          </button>
        </div>
      </section>
               
      {/* 08 - Performance Dashboard */}
      <button
        type="button"
        className="lm-inside-shortcut"
        onClick={() => navigate("/inside-sales/performance")}
      >
        <div className="lm-inside-shortcut-icon interest">
          <span>08</span>
        </div>

        <h3>My Performance</h3>

        <p>
          Track your calls, customer engagement, follow-ups and property visits.
        </p>

        <span className="lm-inside-shortcut-label">
          Performance Analytics
        </span>
      </button>


      {/* Company Announcements */}
      <section className="lm-inside-section">
        <div className="lm-inside-section-heading">
          <div>
            <h2>Company Announcements</h2>
            <p>
              Important updates and messages from your organization.
            </p>
          </div>

          <button
            type="button"
            className="lm-inside-refresh"
            onClick={fetchAnnouncements}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="lm-inside-state">
            <div className="lm-inside-spinner" />
            <p>Loading announcements...</p>
          </div>
        ) : error ? (
          <div className="lm-inside-error">
            <p>{error}</p>

            <button type="button" onClick={fetchAnnouncements}>
              Try Again
            </button>
          </div>
        ) : announcements.length === 0 ? (
          <div className="lm-inside-empty">
            <div className="lm-inside-empty-icon">i</div>

            <h3>No announcements yet</h3>

            <p>
              There are currently no active announcements for your role.
            </p>
          </div>
        ) : (
          <div className="lm-inside-announcements">
            {announcements.map((announcement) => (
              <article
                className="lm-inside-announcement"
                key={announcement._id}
              >
                <div className="lm-inside-announcement-top">
                  <div className="lm-inside-announcement-title">
                    <span className="lm-inside-announcement-dot" />
                    <h3>{announcement.title}</h3>
                  </div>

                  <span
                    className={`lm-inside-priority ${
                      announcement.priority || "normal"
                    }`}
                  >
                    {announcement.priority || "Normal"}
                  </span>
                </div>

                <p className="lm-inside-announcement-message">
                  {announcement.message}
                </p>

                <div className="lm-inside-announcement-footer">
                  <span>
                    Posted {formatDate(announcement.createdAt)}
                  </span>

                  <span>
                    {announcement.expiresAt
                      ? `Expires ${formatDate(announcement.expiresAt)}`
                      : "No expiry"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default InsideSalesDashboard;
