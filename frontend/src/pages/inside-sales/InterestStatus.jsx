
import { useCallback, useEffect, useMemo, useState } from "react";
import customerService from "../../services/customerService.js";
import "../../styles/pages/interest-status.css";

const interestOptions = [
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "thinking", label: "Thinking" },
  { value: "callback_requested", label: "Callback Requested" },
];

const formatLabel = (value) => {
  const option = interestOptions.find((item) => item.value === value);
  return option?.label || "Thinking";
};

const InterestStatus = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await customerService.getMyAssignedCustomers();
      setCustomers(result || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load customer interest statuses."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const stats = useMemo(() => ({
    total: customers.length,
    interested: customers.filter(
      (customer) => customer.interestStatus === "interested"
    ).length,
    thinking: customers.filter(
      (customer) => customer.interestStatus === "thinking"
    ).length,
    callbacks: customers.filter(
      (customer) => customer.interestStatus === "callback_requested"
    ).length,
    notInterested: customers.filter(
      (customer) => customer.interestStatus === "not_interested"
    ).length,
  }), [customers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        [
          customer.name,
          customer.phone,
          customer.email,
          customer.interestedProperty,
          customer.preferredLocation,
        ].some((value) => value?.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "all" ||
        (customer.interestStatus || "thinking") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  return (
    <main className="lm-interest-page">
      <header className="lm-interest-header">
        <div>
          <span className="lm-interest-eyebrow">
            INSIDE SALES / CUSTOMER MANAGEMENT
          </span>
          <h1>Interest Status</h1>
          <p>
            Monitor customer interest and identify the best opportunities
            for your next sales conversation.
          </p>
        </div>

        <button
          type="button"
          className="lm-interest-refresh"
          onClick={fetchCustomers}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </header>

      <section className="lm-interest-stats">
        <article className="lm-interest-stat">
          <span>Total Customers</span>
          <strong>{stats.total}</strong>
          <small>Assigned to you</small>
        </article>

        <article className="lm-interest-stat">
          <span>Interested</span>
          <strong>{stats.interested}</strong>
          <small>Positive opportunities</small>
        </article>

        <article className="lm-interest-stat">
          <span>Thinking</span>
          <strong>{stats.thinking}</strong>
          <small>Awaiting decision</small>
        </article>

        <article className="lm-interest-stat">
          <span>Callbacks</span>
          <strong>{stats.callbacks}</strong>
          <small>Follow-up requested</small>
        </article>

        <article className="lm-interest-stat">
          <span>Not Interested</span>
          <strong>{stats.notInterested}</strong>
          <small>Not proceeding</small>
        </article>
      </section>

      <section className="lm-interest-content">
        <div className="lm-interest-toolbar">
          <input
            type="search"
            placeholder="Search customer, phone or property..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Interest Statuses</option>
            {interestOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="lm-interest-table-heading">
          <div>
            <h2>Customer Interest Overview</h2>
            <p>{filteredCustomers.length} customers found</p>
          </div>
        </div>

        {error && (
          <div className="lm-interest-error">
            {error}
            <button type="button" onClick={fetchCustomers}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="lm-interest-state">
            Loading customer interest information...
          </div>
        ) : !error && filteredCustomers.length === 0 ? (
          <div className="lm-interest-state">
            <h3>No customers found</h3>
            <p>
              Try another search or select a different interest status.
            </p>
          </div>
        ) : (
          !error && (
            <div className="lm-interest-table-wrap">
              <table className="lm-interest-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Interested Property</th>
                    <th>Preferred Location</th>
                    <th>Budget</th>
                    <th>Interest Status</th>
                    <th>Next Follow-up</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((customer) => {
                    const status =
                      customer.interestStatus || "thinking";

                    return (
                      <tr key={customer._id}>
                        <td>
                          <div className="lm-interest-customer">
                            <strong>{customer.name}</strong>
                            <span>{customer.phone}</span>
                          </div>
                        </td>

                        <td>
                          {customer.interestedProperty || "Not specified"}
                        </td>

                        <td>
                          {customer.preferredLocation || "Not specified"}
                        </td>

                        <td>
                          {customer.budgetMin || customer.budgetMax
                            ? `₹${Number(customer.budgetMin || 0).toLocaleString("en-IN")} - ₹${Number(customer.budgetMax || 0).toLocaleString("en-IN")}`
                            : "Not specified"}
                        </td>

                        <td>
                          <span
                            className={`lm-interest-badge lm-interest-${status}`}
                          >
                            {formatLabel(status)}
                          </span>
                        </td>

                        <td>
                          {customer.followUpDate
                            ? new Date(
                                customer.followUpDate
                              ).toLocaleDateString("en-IN")
                            : "Not scheduled"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </section>
    </main>
  );
};

export default InterestStatus;
