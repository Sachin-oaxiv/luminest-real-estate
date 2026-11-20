
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import "../../styles/pages/follow-ups.css";

const FILTERS = [
  { value: "all", label: "All Follow-ups" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due Today" },
  { value: "upcoming", label: "Upcoming" },
];

const formatLabel = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

const dateKey = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function FollowUps() {
  const navigate = useNavigate();

  const [followUps, setFollowUps] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/assignments/my-follow-ups");
      setFollowUps(response.data.followUps || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your follow-ups."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  const today = dateKey(new Date());

  const categorized = useMemo(() => {
    return followUps.map((customer) => {
      const dueDate = dateKey(customer.followUpDate);

      let category = "upcoming";

      if (dueDate < today) category = "overdue";
      else if (dueDate === today) category = "today";

      return { ...customer, category };
    });
  }, [followUps, today]);

  const filteredFollowUps = useMemo(() => {
    return categorized.filter((customer) => {
      const term = search.toLowerCase();

      const matchesSearch =
        customer.name?.toLowerCase().includes(term) ||
        customer.phone?.toLowerCase().includes(term) ||
        customer.interestedProperty?.toLowerCase().includes(term);

      const matchesFilter =
        filter === "all" || customer.category === filter;

      return matchesSearch && matchesFilter;
    });
  }, [categorized, search, filter]);

  const counts = {
    total: followUps.length,
    overdue: categorized.filter((item) => item.category === "overdue").length,
    today: categorized.filter((item) => item.category === "today").length,
    upcoming: categorized.filter((item) => item.category === "upcoming").length,
  };

  return (
    <main className="lm-followups-page">
      <header className="lm-followups-header">
        <div>
          <span className="lm-followups-eyebrow">
            INSIDE SALES WORKSPACE
          </span>
          <h1>My Follow-ups</h1>
          <p>
            Stay on top of customer callbacks and never miss an important
            follow-up.
          </p>
        </div>

        <button
          type="button"
          className="lm-followups-refresh"
          onClick={fetchFollowUps}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </header>

      <section className="lm-followups-stats">
        <article className="lm-followups-stat">
          <span>Total Follow-ups</span>
          <strong>{counts.total}</strong>
        </article>

        <article className="lm-followups-stat overdue">
          <span>Overdue</span>
          <strong>{counts.overdue}</strong>
        </article>

        <article className="lm-followups-stat today">
          <span>Due Today</span>
          <strong>{counts.today}</strong>
        </article>

        <article className="lm-followups-stat upcoming">
          <span>Upcoming</span>
          <strong>{counts.upcoming}</strong>
        </article>
      </section>

      <section className="lm-followups-content">
        <div className="lm-followups-toolbar">
          <div>
            <h2>Customer Callback List</h2>
            <p>Customers assigned to your account with a scheduled follow-up.</p>
          </div>

          <input
            type="search"
            placeholder="Search customer, phone or property..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="lm-followups-filters">
          {FILTERS.map((item) => (
            <button
              type="button"
              key={item.value}
              className={filter === item.value ? "active" : ""}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="lm-followups-error">
            <span>{error}</span>
            <button type="button" onClick={fetchFollowUps}>
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="lm-followups-state">
            Loading your follow-ups...
          </div>
        ) : !error && filteredFollowUps.length === 0 ? (
          <div className="lm-followups-empty">
            <span>◎</span>
            <h3>No follow-ups found</h3>
            <p>
              {search
                ? "Try another search term."
                : "There are no customers in this follow-up category."}
            </p>
          </div>
        ) : !error ? (
          <div className="lm-followups-list">
            {filteredFollowUps.map((customer) => (
              <article
                className="lm-followups-card"
                key={customer._id}
              >
                <div className="lm-followups-card-main">
                  <div className="lm-followups-customer">
                    <h3>{customer.name}</h3>
                    <span>{customer.phone || "No phone number"}</span>
                  </div>

                  <span
                    className={`lm-followups-category ${customer.category}`}
                  >
                    {customer.category === "overdue"
                      ? "Overdue"
                      : customer.category === "today"
                        ? "Due Today"
                        : "Upcoming"}
                  </span>
                </div>

                <div className="lm-followups-details">
                  <div>
                    <span>Follow-up Date</span>
                    <strong>{formatDate(customer.followUpDate)}</strong>
                  </div>

                  <div>
                    <span>Interest Status</span>
                    <strong>
                      {formatLabel(customer.interestStatus || "thinking")}
                    </strong>
                  </div>

                  <div>
                    <span>Interested Property</span>
                    <strong>
                      {customer.interestedProperty || "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>Sales Status</span>
                    <strong>{formatLabel(customer.status || "new")}</strong>
                  </div>
                </div>

                <div className="lm-followups-card-actions">
                  <button
                    type="button"
                    onClick={() => navigate("/inside-sales/customers")}
                  >
                    Open Customer List
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!loading && !error && (
          <div className="lm-followups-footer">
            Showing {filteredFollowUps.length} of {followUps.length} follow-ups
          </div>
        )}
      </section>
    </main>
  );
}
