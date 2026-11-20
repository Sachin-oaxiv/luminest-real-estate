
import { useCallback, useEffect, useMemo, useState } from "react";
import customerService from "../../services/customerService.js";
import CustomSelect from "../../components/common/CustomSelect.jsx";
import { Pencil, Pause, RefreshCw, Trash2 } from "lucide-react";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  interestedProperty: "",
  budgetMin: "",
  budgetMax: "",
  preferredLocation: "",
  notes: "",
  status: "new",
};

const statusOptions = [
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

  const formatAmount = (amount) =>
    Number(amount).toLocaleString("en-IN");

  if (min != null && max != null) {
    return `₹${formatAmount(min)} - ₹${formatAmount(max)}`;
  }

  if (min != null) return `From ₹${formatAmount(min)}`;

  return `Up to ₹${formatAmount(max)}`;
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountStatusFilter, setAccountStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isTableFullView, setIsTableFullView] = useState(false);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await customerService.getAllCustomers();
      setCustomers(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load customer information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handle form inputs
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  // Open create form
  const handleCreate = () => {
    setForm(initialForm);
    setEditingId(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // Open edit form
  const handleEdit = (customer) => {
    if (!customer.isActive) return;

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      interestedProperty: customer.interestedProperty || "",
      budgetMin: customer.budgetMin ?? "",
      budgetMax: customer.budgetMax ?? "",
      preferredLocation: customer.preferredLocation || "",
      notes: customer.notes || "",
      status: customer.status || "new",
    });

    setEditingId(customer._id || customer.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // Create or update customer
  const handleSubmit = async (event) => {
    event.preventDefault();

    const minBudget =
      form.budgetMin === "" ? undefined : Number(form.budgetMin);

    const maxBudget =
      form.budgetMax === "" ? undefined : Number(form.budgetMax);

    if (
      minBudget !== undefined &&
      (!Number.isFinite(minBudget) || minBudget < 0)
    ) {
      setError("Minimum budget must be a valid non-negative number.");
      return;
    }

    if (
      maxBudget !== undefined &&
      (!Number.isFinite(maxBudget) || maxBudget < 0)
    ) {
      setError("Maximum budget must be a valid non-negative number.");
      return;
    }

    if (
      minBudget !== undefined &&
      maxBudget !== undefined &&
      minBudget > maxBudget
    ) {
      setError("Minimum budget cannot exceed maximum budget.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        interestedProperty: form.interestedProperty.trim(),
        preferredLocation: form.preferredLocation.trim(),
        notes: form.notes.trim(),
        status: form.status,
      };

      if (minBudget !== undefined) {
        payload.budgetMin = minBudget;
      }

      if (maxBudget !== undefined) {
        payload.budgetMax = maxBudget;
      }

      if (editingId) {
        await customerService.updateCustomer(editingId, payload);
        setSuccess("Customer details updated successfully.");
      } else {
        await customerService.createCustomer(payload);
        setSuccess("Customer created successfully.");
      }

      resetForm();
      await fetchCustomers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save customer information."
      );
    } finally {
      setSaving(false);
    }
  };

  // Deactivate customer
  const handleDeactivate = async (customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${customer.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await customerService.deactivateCustomer(
        customer._id || customer.id
      );

      setSuccess(`${customer.name} has been deactivated.`);
      await fetchCustomers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to deactivate customer."
      );
    }
  };

  // Reactivate customer
  const handleReactivate = async (customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to reactivate ${customer.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await customerService.reactivateCustomer(
        customer._id || customer.id
      );

      setSuccess(`${customer.name} has been reactivated.`);
      await fetchCustomers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reactivate customer."
      );
    }
  };

  // Permanently delete customer
const handlePermanentDelete = async (customer) => {
  const confirmed = window.confirm(
    `WARNING: Are you sure you want to permanently delete ${customer.name}?\n\nThis action cannot be undone. The customer can only be deleted if no linked calls, messages, or visits exist.`
  );

  if (!confirmed) return;

  const customerId = customer._id || customer.id;

  try {
    setDeletingId(customerId);
    setError("");
    setSuccess("");

    await customerService.permanentlyDeleteCustomer(customerId);

    setSuccess(
      `${customer.name} has been permanently deleted.`
    );

    await fetchCustomers();
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Unable to permanently delete customer."
    );
  } finally {
    setDeletingId(null);
  }
};

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        customer.name?.toLowerCase().includes(searchTerm) ||
        customer.phone?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" ||
        customer.status === statusFilter;

      const matchesAccountStatus =
        accountStatusFilter === "all" ||
        (accountStatusFilter === "active" && customer.isActive) ||
        (accountStatusFilter === "inactive" && !customer.isActive);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAccountStatus
      );
    });
  }, [customers, search, statusFilter, accountStatusFilter]);

  // Statistics
  const totalCustomers = customers.length;

  const newCustomers = customers.filter(
    (customer) => customer.status === "new"
  ).length;

  const activeJourneyCustomers = customers.filter(
    (customer) =>
      !["closed", "lost"].includes(customer.status)
  ).length;

  const activeCustomers = customers.filter(
    (customer) => customer.isActive
  ).length;

  const inactiveCustomers = customers.filter(
    (customer) => !customer.isActive
  ).length;

  if (loading) {
    return (
      <main className="admin-page customer-management-page">
        <div className="admin-page-loading">
          Loading customers...
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page customer-management-page">

      {/* Page Header */}
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">
            CUSTOMER RELATIONSHIP MANAGEMENT
          </p>
          <h1>Customer Management</h1>
          <p>Manage customer details and sales journey.</p>
        </div>

        <button
          className="admin-primary-button"
          onClick={handleCreate}
        >
          + Add Customer
        </button>
      </header>

      {/* Alerts */}
      {error && (
        <div className="admin-alert admin-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert-success">
          {success}
        </div>
      )}

      {/* Statistics */}
      <section className="announcement-stats">
        <article>
          <span>Total Customers</span>
          <strong>{totalCustomers}</strong>
        </article>

        <article>
          <span>New Customers</span>
          <strong>{newCustomers}</strong>
        </article>

        <article>
          <span>Active Sales Journey</span>
          <strong>{activeJourneyCustomers}</strong>
        </article>
      </section>

      {/* Account Status Summary */}
      <section className="announcement-stats">
        <article>
          <span>Active Accounts</span>
          <strong>{activeCustomers}</strong>
        </article>

        <article>
          <span>Inactive Accounts</span>
          <strong>{inactiveCustomers}</strong>
        </article>
      </section>

      {/* Customer Form */}
      {showForm && (
        <section className="announcement-form-card">

          <div className="announcement-form-heading">
            <div>
              <h2>
                {editingId ? "Edit Customer" : "Add New Customer"}
              </h2>

              <p>
                {editingId
                  ? "Update customer information."
                  : "Enter the customer's details below."}
              </p>
            </div>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={resetForm}
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="announcement-form-grid">

              <div className="announcement-field">
                <label htmlFor="customer-name">Customer Name *</label>
                <input
                  id="customer-name"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  maxLength={100}
                  required
                />
              </div>

              <div className="announcement-field">
                <label htmlFor="customer-phone">Phone Number *</label>
                <input
                  id="customer-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div className="announcement-field">
                <label htmlFor="customer-email">Email Address</label>
                <input
                  id="customer-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="customer@email.com"
                />
              </div>

              <div className="announcement-field">
                <label htmlFor="customer-property">
                  Interested Property
                </label>
                <input
                  id="customer-property"
                  name="interestedProperty"
                  value={form.interestedProperty}
                  onChange={handleInputChange}
                  placeholder="Apartment, villa, plot..."
                />
              </div>

              <div className="announcement-field">
                <label htmlFor="customer-budget-min">
                  Minimum Budget (₹)
                </label>
                <input
                  id="customer-budget-min"
                  name="budgetMin"
                  type="number"
                  min="0"
                  value={form.budgetMin}
                  onChange={handleInputChange}
                  placeholder="Minimum budget"
                />
              </div>

              <div className="announcement-field">
                <label htmlFor="customer-budget-max">
                  Maximum Budget (₹)
                </label>
                <input
                  id="customer-budget-max"
                  name="budgetMax"
                  type="number"
                  min="0"
                  value={form.budgetMax}
                  onChange={handleInputChange}
                  placeholder="Maximum budget"
                />
              </div>

              <div className="announcement-field">
                <label htmlFor="customer-location">
                  Preferred Location
                </label>
                <input
                  id="customer-location"
                  name="preferredLocation"
                  value={form.preferredLocation}
                  onChange={handleInputChange}
                  placeholder="Enter preferred location"
                />
              </div>

              <div className="announcement-field">
                <label htmlFor="customer-status">
                  Sales Journey Status
                </label>
                <select
                  id="customer-status"
                  name="status"
                  value={form.status}
                  onChange={handleInputChange}
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="announcement-field full-width">
                <label htmlFor="customer-notes">Notes</label>
                <textarea
                  id="customer-notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleInputChange}
                  placeholder="Additional customer information..."
                  rows={3}
                />
              </div>

            </div>

            <div className="announcement-form-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Create Customer"}
              </button>
            </div>

          </form>
        </section>
      )}

      {/* Customer Table */}
      <section
        className={`announcement-management-card customer-table-card ${
          isTableFullView ? "customer-table-fullscreen" : ""
        }`}
      >

        <div className="announcement-toolbar">
          <div>
            <h2>All Customers</h2>
            <p>View and manage registered customer information.</p>
          </div>

          <div className="announcement-filters">

            <input
              type="search"
              placeholder="Search name, phone or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {/* Sales Journey Filter */}
            
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Journey Status"
              options={[
                { value: "all", label: "All Journey Status" },
                ...statusOptions,
              ]}
            />


            {/* Account Status Filter */}
           
              <CustomSelect
                value={accountStatusFilter}
                onChange={setAccountStatusFilter}
                placeholder="All Account Status"
                options={[
                  { value: "all", label: "All Account Status" },
                  { value: "active", label: "Active Customers" },
                  { value: "inactive", label: "Inactive Customers" },
                ]}
              />


            {/* Full View Button */}
            <button
              type="button"
              className="admin-secondary-button customer-fullview-button"
              onClick={() =>
                setIsTableFullView((previous) => !previous)
              }
            >
              {isTableFullView
                ? "✕ Exit Full View"
                : "⛶ Full View"}
            </button>

          </div>
        </div>

        <div className="announcement-table-wrapper">
          <table className="announcement-table">

            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Interested Property</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Added On</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="announcement-empty">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer._id || customer.id}>

                    {/* Customer Details */}
                    <td>
                      <strong>{customer.name}</strong>
                      {customer.email && (
                        <small className="customer-table-email">
                          {customer.email}
                        </small>
                      )}
                    </td>

                    {/* Phone */}
                    <td>{customer.phone}</td>

                    {/* Interested Property */}
                    <td>
                      {customer.interestedProperty || "—"}
                    </td>

                    {/* Budget */}
                    <td>
                      {formatBudget(
                        customer.budgetMin,
                        customer.budgetMax
                      )}
                    </td>

                    {/* Sales Journey and Account Status */}
                    <td>
                      <div className="customer-status-group">
                        <span
                          className={`announcement-status ${
                            customer.status === "closed"
                              ? "active"
                              : customer.status === "lost"
                                ? "inactive"
                                : "pending"
                          }`}
                        >
                          {formatLabel(customer.status)}
                        </span>

                        <span
                          className={`announcement-status ${
                            customer.isActive ? "active" : "inactive"
                          }`}
                        >
                          {customer.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    {/* Added Date */}
                    <td>{formatDate(customer.createdAt)}</td>

                    {/* Actions */}
                    <td>
                      <div className="announcement-actions customer-row-actions">
                        {customer.isActive ? (
                          <>
                            <button
                              type="button"
                              className="customer-action customer-action-edit"
                              onClick={() => handleEdit(customer)}
                              title="Edit customer details"
                            >
                              <Pencil size={15} strokeWidth={2.1} aria-hidden="true" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              className="customer-action customer-action-deactivate"
                              onClick={() => handleDeactivate(customer)}
                              title="Deactivate this customer"
                            >
                              <Pause size={15} strokeWidth={2.1} aria-hidden="true" />
                              <span>Deactivate</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="customer-action customer-action-reactivate"
                              onClick={() => handleReactivate(customer)}
                              title="Reactivate this customer"
                            >
                              <RefreshCw size={15} strokeWidth={2.1} aria-hidden="true" />
                              <span>Reactivate</span>
                            </button>

                            <button
                              type="button"
                              className="customer-action customer-action-delete"
                              onClick={() => handlePermanentDelete(customer)}
                              disabled={deletingId === (customer._id || customer.id)}
                              title="Permanently delete this customer"
                            >
<Trash2 size={15} strokeWidth={2.1} aria-hidden="true" />
                              <span>{deletingId === (customer._id || customer.id) ? "Deleting" : "Delete"}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>

      </section>
    </main>
  );
}
