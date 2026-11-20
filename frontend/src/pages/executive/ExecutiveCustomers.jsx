
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api.js";
import CustomSelect from "../../components/common/CustomSelect.jsx";
import ExecutiveCustomerForm from "../../components/executive/ExecutiveCustomerForm.jsx";
import "../../styles/pages/executive-customers.css";

const statusOptions = [
  { value: "all", label: "All Sales Statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "visit_scheduled", label: "Visit Scheduled" },
  { value: "visited", label: "Visited" },
  { value: "closed", label: "Closed" },
  { value: "lost", label: "Lost" },
];

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

const formatBudget = (min, max) => {
  if (min == null && max == null) return "Not specified";

  const amount = (value) => Number(value).toLocaleString("en-IN");

  if (min != null && max != null) {
    return `₹${amount(min)} – ₹${amount(max)}`;
  }

  if (min != null) return `From ₹${amount(min)}`;
  return `Up to ₹${amount(max)}`;
};

const getCustomerId = (customer) =>
  customer?._id || customer?.id || "";

const getAssignedEmployeeId = (customer) => {
  const assigned = customer?.assignedTo;

  if (assigned && typeof assigned === "object") {
    return assigned._id || assigned.id || "";
  }

  return assigned || "";
};

export default function ExecutiveCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [deactivatingCustomer, setDeactivatingCustomer] =
    useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const [insideSalesEmployees, setInsideSalesEmployees] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState({});
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [assigningCustomerId, setAssigningCustomerId] = useState(null);

  // Load active customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers");
      setCustomers(response.data.customers || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load customer records."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load active Inside Sales employees
  const fetchInsideSalesEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);

      const response = await api.get(
        "/assignments/available-employees"
      );

      setInsideSalesEmployees(response.data.employees || []);
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Unable to load Inside Sales employees."
      );
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchInsideSalesEmployees();
  }, [fetchInsideSalesEmployees]);

  // Keep assignment selectors synchronized with customer records
  useEffect(() => {
    setSelectedAssignees((previous) => {
      const next = { ...previous };

      customers.forEach((customer) => {
        const customerId = getCustomerId(customer);
        const assignedId = getAssignedEmployeeId(customer);

        if (!(customerId in next)) {
          next[customerId] = assignedId;
        }
      });

      return next;
    });
  }, [customers]);

  // Close create/edit form
  const closeCustomerForm = () => {
    setShowCreateForm(false);
    setEditingCustomer(null);
  };

  // Refresh after creating or editing a customer
  const handleCustomerSaved = async () => {
    closeCustomerForm();
    await fetchCustomers();
  };

  // Assign or reassign customer
  const handleAssignCustomer = async (customer) => {
    const customerId = getCustomerId(customer);
    const employeeId = selectedAssignees[customerId];

    if (!customerId) {
      setActionError("Customer ID is missing.");
      return;
    }

    if (!employeeId) {
      setActionError("Please select an Inside Sales employee.");
      setActionMessage("");
      return;
    }

    const currentEmployeeId = getAssignedEmployeeId(customer);

    if (currentEmployeeId === employeeId) {
      setActionError(
        "This customer is already assigned to the selected employee."
      );
      setActionMessage("");
      return;
    }

    try {
      setAssigningCustomerId(customerId);
      setActionError("");
      setActionMessage("");

      const response = await api.post("/assignments", {
        customerId,
        employeeId,
      });

      const employee = insideSalesEmployees.find(
        (item) => (item._id || item.id) === employeeId
      );

      setActionMessage(
        response.data?.message ||
          `${customer.name} assigned to ${
            employee?.name || "the selected employee"
          }.`
      );

      await fetchCustomers();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Unable to assign this customer. Please try again."
      );
    } finally {
      setAssigningCustomerId(null);
    }
  };

  // Deactivate customer (soft delete)
  const handleDeactivateCustomer = async () => {
    const customerId = getCustomerId(deactivatingCustomer);

    if (!customerId) {
      setActionError("Customer ID is missing.");
      return;
    }

    try {
      setDeactivating(true);
      setActionError("");
      setActionMessage("");

      const response = await api.patch(
        `/customers/${customerId}/deactivate`
      );

      setDeactivatingCustomer(null);

      setActionMessage(
        response.data?.message ||
          "Customer deactivated successfully."
      );

      await fetchCustomers();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Unable to deactivate this customer. Please try again."
      );
    } finally {
      setDeactivating(false);
    }
  };

  // Search and filter customers
  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !term ||
        customer.name?.toLowerCase().includes(term) ||
        customer.phone?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.interestedProperty?.toLowerCase().includes(term) ||
        customer.preferredLocation?.toLowerCase().includes(term) ||
        customer.assignedTo?.name?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  // Dashboard statistics
  const assignedCount = customers.filter(
    (customer) => customer.assignedTo
  ).length;

  const unassignedCount = customers.length - assignedCount;

  const qualifiedCount = customers.filter(
    (customer) => customer.status === "qualified"
  ).length;

  return (
    <main className="lm-executive-customers">

      {/* PAGE HEADER */}
      <header className="lm-executive-customers-header">
        <div>
          <p className="lm-executive-customers-eyebrow">
            CUSTOMER RELATIONSHIP MANAGEMENT
          </p>

          <h1>Customer Management</h1>

          <p>
            View customer records, monitor their sales journey and
            track Inside Sales allocation.
          </p>
        </div>

        <div className="lm-executive-customer-header-actions">
          <button
            type="button"
            className="lm-executive-refresh"
            onClick={fetchCustomers}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh Data"}
          </button>

          <button
            type="button"
            className="lm-executive-add-customer"
            onClick={() => {
              setEditingCustomer(null);
              setShowCreateForm(true);
            }}
          >
            + Add Customer
          </button>
        </div>
      </header>

      {/* CUSTOMER STATISTICS */}
      <section className="lm-executive-customer-stats">
        <article className="lm-executive-customer-stat">
          <span>Total Customers</span>
          <strong>{customers.length}</strong>
          <small>Active customer records</small>
        </article>

        <article className="lm-executive-customer-stat">
          <span>Assigned Customers</span>
          <strong>{assignedCount}</strong>
          <small>Allocated to Inside Sales</small>
        </article>

        <article className="lm-executive-customer-stat">
          <span>Awaiting Assignment</span>
          <strong>{unassignedCount}</strong>
          <small>Not yet allocated</small>
        </article>

        <article className="lm-executive-customer-stat">
          <span>Qualified Leads</span>
          <strong>{qualifiedCount}</strong>
          <small>Marked as qualified</small>
        </article>
      </section>

      {/* CUSTOMER TABLE */}
      <section className="lm-executive-customer-panel">
        <div className="lm-executive-customer-panel-heading">
          <div>
            <h2>All Customers</h2>
            <p>
              Browse customer information and assignment details.
            </p>
          </div>

          <span className="lm-executive-customer-count">
            {filteredCustomers.length} Records
          </span>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="lm-executive-customer-toolbar">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, phone, property or employee..."
            aria-label="Search customers"
          />

          <div className="lm-executive-customer-status-filter">
            <CustomSelect
              value={statusFilter}
              options={statusOptions}
              onChange={setStatusFilter}
              placeholder="Filter sales status"
            />
          </div>
        </div>

        {/* SUCCESS MESSAGE */}
        {actionMessage && (
          <div
            className="lm-executive-customer-success"
            role="status"
          >
            <span>{actionMessage}</span>

            <button
              type="button"
              onClick={() => setActionMessage("")}
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {/* ACTION ERROR */}
        {actionError && (
          <div
            className="lm-executive-customer-error"
            role="alert"
          >
            <span>{actionError}</span>

            <button
              type="button"
              onClick={() => setActionError("")}
              aria-label="Dismiss error message"
            >
              ×
            </button>
          </div>
        )}

        {/* CUSTOMER FETCH ERROR */}
        {error && (
          <div className="lm-executive-customer-error">
            <span>{error}</span>

            <button type="button" onClick={fetchCustomers}>
              Try again
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="lm-executive-customer-state">
            Loading customer records...
          </div>
        ) : !error && filteredCustomers.length === 0 ? (
          <div className="lm-executive-customer-state">
            <strong>No customers found</strong>
            <span>
              Try changing your search or sales-status filter.
            </span>
          </div>
        ) : !error ? (

          /* CUSTOMER TABLE */
          <div className="lm-executive-customer-table-wrap">
            <table className="lm-executive-customer-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Interested Property</th>
                  <th>Budget</th>
                  <th>Assigned To</th>
                  <th>Sales Status</th>
                  <th>Added On</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => {
                  const customerId = getCustomerId(customer);
                  const currentEmployeeId =
                    getAssignedEmployeeId(customer);

                  const selectedEmployeeId =
                    selectedAssignees[customerId] ??
                    currentEmployeeId;

                  const isAssigning =
                    assigningCustomerId === customerId;

                  return (
                    <tr key={customerId}>
                      {/* CUSTOMER */}
                      <td>
                        <div className="lm-executive-customer-identity">
                          <strong>{customer.name}</strong>

                          <small>
                            {customer.preferredLocation ||
                              "Location not specified"}
                          </small>
                        </div>
                      </td>

                      {/* CONTACT */}
                      <td>
                        <div className="lm-executive-customer-contact">
                          <span>{customer.phone || "—"}</span>
                          <small>{customer.email || "—"}</small>
                        </div>
                      </td>

                      {/* PROPERTY */}
                      <td>
                        {customer.interestedProperty || "—"}
                      </td>

                      {/* BUDGET */}
                      <td>
                        {formatBudget(
                          customer.budgetMin,
                          customer.budgetMax
                        )}
                      </td>

                      {/* ASSIGNMENT */}

                        <td>
                          <div className="lm-executive-assignment-cell">
                            <select
                              className="lm-executive-assignment-native-select"
                              value={
                                selectedAssignees[customer._id || customer.id] ??
                                (
                                  typeof customer.assignedTo === "object" &&
                                  customer.assignedTo
                                    ? customer.assignedTo._id ||
                                      customer.assignedTo.id ||
                                      ""
                                    : customer.assignedTo || ""
                                )
                              }
                              onChange={(event) =>
                                setSelectedAssignees((previous) => ({
                                  ...previous,
                                  [customer._id || customer.id]: event.target.value,
                                }))
                              }
                              disabled={
                                loadingEmployees ||
                                assigningCustomerId === (customer._id || customer.id) ||
                                insideSalesEmployees.length === 0
                              }
                            >
                              <option value="">
                                {loadingEmployees ? "Loading..." : "Select employee"}
                              </option>

                              {insideSalesEmployees.map((employee) => (
                                <option
                                  key={employee._id || employee.id}
                                  value={employee._id || employee.id}
                                >
                                  {employee.name}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              className="lm-executive-customer-assign"
                              onClick={() => handleAssignCustomer(customer)}
                              disabled={
                                loadingEmployees ||
                                assigningCustomerId === (customer._id || customer.id) ||
                                !selectedAssignees[customer._id || customer.id] ||
                                selectedAssignees[customer._id || customer.id] ===
                                  (
                                    typeof customer.assignedTo === "object" &&
                                    customer.assignedTo
                                      ? customer.assignedTo._id ||
                                        customer.assignedTo.id ||
                                        ""
                                      : customer.assignedTo || ""
                                  )
                              }
                            >
                              {assigningCustomerId === (customer._id || customer.id)
                                ? "Saving..."
                                : customer.assignedTo
                                  ? "Reassign"
                                  : "Assign"}
                            </button>
                          </div>
                        </td>


                      {/* SALES STATUS */}
                      <td>
                        <span
                          className={`lm-executive-sales-status status-${customer.status || "new"}`}
                        >
                          {formatLabel(customer.status || "new")}
                        </span>
                      </td>

                      {/* DATE */}
                      <td>{formatDate(customer.createdAt)}</td>

                      {/* ACTIONS */}
                      <td>
                        <div className="lm-executive-customer-row-actions">
                          <button
                            type="button"
                            className="lm-executive-customer-edit"
                            onClick={() =>
                              setEditingCustomer(customer)
                            }
                            aria-label={`Edit ${customer.name || "customer"}`}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="lm-executive-customer-deactivate"
                            onClick={() => {
                              setActionError("");
                              setActionMessage("");
                              setDeactivatingCustomer(customer);
                            }}
                            aria-label={`Deactivate ${customer.name || "customer"}`}
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {/* CREATE / EDIT FORM */}
      {(showCreateForm || editingCustomer) && (
        <ExecutiveCustomerForm
          customer={editingCustomer}
          onCancel={closeCustomerForm}
          onSuccess={handleCustomerSaved}
        />
      )}

      {/* DEACTIVATION CONFIRMATION */}
      {deactivatingCustomer && (
        <div
          className="lm-executive-deactivate-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deactivating
            ) {
              setDeactivatingCustomer(null);
            }
          }}
        >
          <section
            className="lm-executive-deactivate-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lm-executive-deactivate-title"
            aria-describedby="lm-executive-deactivate-description"
          >
            <div
              className="lm-executive-deactivate-icon"
              aria-hidden="true"
            >
              !
            </div>

            <h2 id="lm-executive-deactivate-title">
              Deactivate customer?
            </h2>

            <p id="lm-executive-deactivate-description">
              Are you sure you want to deactivate{" "}
              <strong>
                {deactivatingCustomer.name || "this customer"}
              </strong>
              ? This removes the customer from the active customer
              list but keeps the record and its linked history.
            </p>

            {actionError && (
              <p
                className="lm-executive-deactivate-inline-error"
                role="alert"
              >
                {actionError}
              </p>
            )}

            <div className="lm-executive-deactivate-actions">
              <button
                type="button"
                className="lm-executive-deactivate-cancel"
                onClick={() => setDeactivatingCustomer(null)}
                disabled={deactivating}
              >
                Cancel
              </button>

              <button
                type="button"
                className="lm-executive-deactivate-confirm"
                onClick={handleDeactivateCustomer}
                disabled={deactivating}
              >
                {deactivating
                  ? "Deactivating..."
                  : "Yes, deactivate"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
