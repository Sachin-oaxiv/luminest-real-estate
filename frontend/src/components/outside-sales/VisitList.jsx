
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api.js";
import VisitCard from "./VisitCard.jsx";
import CustomerVisitDetails from "./CustomerVisitDetails.jsx";
import "../../styles/pages/outside-sales-visits.css";

const FILTERS = [
  { value: "all", label: "All Visits" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function VisitList() {
  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/visits/my-scheduled");

      setVisits(response.data.visits || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your assigned property visits."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleVisitUpdated = (updatedVisit) => {
    if (!updatedVisit?._id) return;

    setVisits((currentVisits) =>
      currentVisits.map((visit) =>
        visit._id === updatedVisit._id
          ? { ...visit, ...updatedVisit }
          : visit
      )
    );

    setSelectedVisit((currentVisit) =>
      currentVisit?._id === updatedVisit._id
        ? { ...currentVisit, ...updatedVisit }
        : currentVisit
    );
  };

  const counts = useMemo(
    () => ({
      total: visits.length,
      scheduled: visits.filter((visit) =>
        ["scheduled", "confirmed", "rescheduled"].includes(visit.status)
      ).length,
      inProgress: visits.filter(
        (visit) => visit.status === "in_progress"
      ).length,
      completed: visits.filter(
        (visit) => visit.status === "completed"
      ).length,
    }),
    [visits]
  );

  const filteredVisits = useMemo(() => {
    const query = search.trim().toLowerCase();

    return visits.filter((visit) => {
      const searchableText = [
        visit.customer?.name,
        visit.customer?.phone,
        visit.propertyName,
        visit.propertyAddress,
        visit.scheduledBy?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "scheduled" &&
          ["scheduled", "confirmed", "rescheduled"].includes(visit.status)) ||
        visit.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [visits, search, filter]);

  return (
    <main className="lm-outside-visits">
      <header className="lm-outside-visits-header">
        <div>
          <span className="lm-outside-visits-eyebrow">
            LUMINEST · OUTSIDE SALES
          </span>

          <h1>My Assigned Visits</h1>

          <p>
            Manage your property visits, meet customers and update visit
            progress.
          </p>
        </div>

        <button
          type="button"
          className="lm-outside-visits-refresh"
          onClick={fetchVisits}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </header>

      <section className="lm-outside-visits-stats">
        <article className="lm-outside-visits-stat">
          <span>Total Visits</span>
          <strong>{counts.total}</strong>
          <small>Visits assigned to you</small>
        </article>

        <article className="lm-outside-visits-stat">
          <span>Scheduled</span>
          <strong>{counts.scheduled}</strong>
          <small>Awaiting property visit</small>
        </article>

        <article className="lm-outside-visits-stat">
          <span>In Progress</span>
          <strong>{counts.inProgress}</strong>
          <small>Arrival confirmed</small>
        </article>

        <article className="lm-outside-visits-stat">
          <span>Completed</span>
          <strong>{counts.completed}</strong>
          <small>Visits completed</small>
        </article>
      </section>

      <section className="lm-outside-visits-content">
        <div className="lm-outside-visits-toolbar">
          <div>
            <h2>Assigned Property Visits</h2>
            <p>Review your visit schedule and customer details.</p>
          </div>

          <input
            type="search"
            className="lm-outside-visits-search"
            placeholder="Search customer, property or address..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="lm-outside-visits-filters">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={
                filter === item.value
                  ? "lm-outside-visits-filter active"
                  : "lm-outside-visits-filter"
              }
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="lm-outside-visits-state">
            Loading your assigned visits...
          </div>
        ) : error ? (
          <div className="lm-outside-visits-error">
            <p>{error}</p>

            <button type="button" onClick={fetchVisits}>
              Try Again
            </button>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="lm-outside-visits-empty">
            <span>◎</span>
            <h3>No visits found</h3>
            <p>
              {visits.length === 0
                ? "Property visits assigned to you will appear here."
                : "No visits match your current search or filter."}
            </p>
          </div>
        ) : (
          <div className="lm-outside-visits-grid">
            {filteredVisits.map((visit) => (
              <VisitCard
                key={visit._id}
                visit={visit}
                onView={setSelectedVisit}
              />
            ))}
          </div>
        )}
      </section>

      {selectedVisit && (
        <CustomerVisitDetails
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onUpdated={handleVisitUpdated}
        />
      )}
    </main>
  );
}
