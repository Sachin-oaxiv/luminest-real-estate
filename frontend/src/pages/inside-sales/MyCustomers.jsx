
import { useCallback, useEffect, useMemo, useState } from "react";
import customerService from "../../services/customerService.js";
import CustomerProfile from "../../components/inside-sales/CustomerProfile.jsx";
import CustomerPhoneActions from "../../components/shared/CustomerPhoneActions.jsx";
import "../../styles/pages/my-customers.css";

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

const getInterestClass = (status) => {
  const classes = {
    interested: "interested",
    not_interested: "not-interested",
    thinking: "thinking",
    callback_requested: "callback",
  };

  return classes[status] || "default";
};

export default function MyCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await customerService.getMyAssignedCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your assigned customers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        customer.name?.toLowerCase().includes(searchText) ||
        customer.phone?.toLowerCase().includes(searchText) ||
        customer.email?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        customer.interestStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const stats = useMemo(() => ({
    total: customers.length,
    interested: customers.filter(
      (c) => c.interestStatus === "interested"
    ).length,
    callbacks: customers.filter(
      (c) => c.interestStatus === "callback_requested"
    ).length,
    thinking: customers.filter(
      (c) => c.interestStatus === "thinking"
    ).length,
  }), [customers]);

  if (selectedCustomer) {
    return (
      <CustomerProfile
        customer={selectedCustomer}
        onBack={() => setSelectedCustomer(null)}
      />
    );
  }

  return (
    <main className="lm-my-customers">
      <header className="lm-customers-header">
        <div>
          <span className="lm-customers-eyebrow">
            LUMINEST · INSIDE SALES
          </span>
          <h1>My Assigned Customers</h1>
          <p>
            Manage your assigned leads, understand customer interests
            and stay on top of follow-ups.
          </p>
        </div>

        <button
          type="button"
          className="lm-customers-refresh"
          onClick={fetchCustomers}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </header>

      <section className="lm-customers-stats">
        <article className="lm-customer-stat">
          <span className="lm-customer-stat-icon blue">01</span>
          <div>
            <span>Total Assigned</span>
            <strong>{stats.total}</strong>
          </div>
        </article>

        <article className="lm-customer-stat">
          <span className="lm-customer-stat-icon green">02</span>
          <div>
            <span>Interested</span>
            <strong>{stats.interested}</strong>
          </div>
        </article>

        <article className="lm-customer-stat">
          <span className="lm-customer-stat-icon orange">03</span>
          <div>
            <span>Callback Requested</span>
            <strong>{stats.callbacks}</strong>
          </div>
        </article>

        <article className="lm-customer-stat">
          <span className="lm-customer-stat-icon purple">04</span>
          <div>
            <span>Thinking</span>
            <strong>{stats.thinking}</strong>
          </div>
        </article>
      </section>

      <section className="lm-customers-content">
        <div className="lm-customers-toolbar">
          <div>
            <h2>Customer Directory</h2>
            <p>Your currently assigned customers.</p>
          </div>

          <div className="lm-customers-filters">
            <input
              type="search"
              placeholder="Search name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Interest Status</option>
              <option value="interested">Interested</option>
              <option value="not_interested">Not Interested</option>
              <option value="thinking">Thinking</option>
              <option value="callback_requested">Callback Requested</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="lm-customers-state">
            <div className="lm-customers-spinner" />
            <p>Loading your customers...</p>
          </div>
        ) : error ? (
          <div className="lm-customers-error">
            <p>{error}</p>
            <button type="button" onClick={fetchCustomers}>
              Try Again
            </button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="lm-customers-empty">
            <span>◎</span>
            <h3>
              {customers.length === 0
                ? "No assigned customers yet"
                : "No matching customers"}
            </h3>
            <p>
              {customers.length === 0
                ? "Customers assigned to you will appear here."
                : "Try changing your search or interest filter."}
            </p>
          </div>
        ) : (
          <div className="lm-customers-table-wrap">
            <table className="lm-customers-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Interested Property</th>
                  <th>Budget</th>
                  <th>Interest Status</th>
                  <th>Follow-up</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer._id}>
                    <td>
                      <div className="lm-customer-identity">
                        <strong>{customer.name}</strong>
                        <span>{customer.email || "No email provided"}</span>
                      </div>
                    </td>

                    <td><CustomerPhoneActions phone={customer.phone} /></td>
                    <td>{customer.interestedProperty || "Not specified"}</td>

                    <td>
                      {customer.budgetMin || customer.budgetMax
                        ? `₹${Number(customer.budgetMin || 0).toLocaleString("en-IN")} – ₹${Number(customer.budgetMax || 0).toLocaleString("en-IN")}`
                        : "Not specified"}
                    </td>

                    <td>
                      <span
                        className={`lm-customer-interest ${getInterestClass(customer.interestStatus)}`}
                      >
                        {formatLabel(customer.interestStatus || "thinking")}
                      </span>
                    </td>

                    <td>{formatDate(customer.followUpDate)}</td>

                    <td>
                      <button
                        type="button"
                        className="lm-customer-view-button"
                        onClick={() => setSelectedCustomer(customer)}
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
    </main>
  );
}
