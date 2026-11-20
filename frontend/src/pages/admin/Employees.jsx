
import { useCallback, useEffect, useMemo, useState } from "react";
import employeeService from "../../services/employeeService.js";
import CustomSelect from "../../components/common/CustomSelect.jsx";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "inside_sales",
};

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "executive", label: "Executive" },
  { value: "inside_sales", label: "Inside Sales" },
  { value: "outside_sales", label: "Outside Sales" },
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

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await employeeService.getAllEmployees();
      setEmployees(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load employee information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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
  const handleEdit = (employee) => {
    setForm({
      name: employee.name || "",
      email: employee.email || "",
      password: "",
      role: employee.role || "inside_sales",
    });

    setEditingId(employee._id || employee.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // Create or update employee
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
      };

      if (editingId) {
        await employeeService.updateEmployee(editingId, payload);
        setSuccess("Employee details updated successfully.");
      } else {
        if (form.password.length < 8) {
          setError("Password must contain at least 8 characters.");
          return;
        }

        await employeeService.createEmployee({
          ...payload,
          password: form.password,
        });

        setSuccess("Employee created successfully.");
      }

      resetForm();
      await fetchEmployees();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save employee information."
      );
    } finally {
      setSaving(false);
    }
  };

  // Deactivate employee
  const handleDeactivate = async (employee) => {
    if (!employee.isActive) return;

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${employee.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await employeeService.deactivateEmployee(
        employee._id || employee.id
      );

      setSuccess(`${employee.name} has been deactivated.`);
      await fetchEmployees();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to deactivate employee."
      );
    }
  };

  // Reactivate employee
  const handleReactivate = async (employee) => {
    if (employee.isActive) return;

    const confirmed = window.confirm(
      `Are you sure you want to reactivate ${employee.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await employeeService.reactivateEmployee(
        employee._id || employee.id
      );

      setSuccess(`${employee.name} has been reactivated.`);
      await fetchEmployees();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reactivate employee."
      );
    }
  };

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        employee.name?.toLowerCase().includes(search.toLowerCase()) ||
        employee.email?.toLowerCase().includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "all" || employee.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && employee.isActive) ||
        (statusFilter === "inactive" && !employee.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [employees, search, roleFilter, statusFilter]);

  // Employee statistics
  const activeCount = employees.filter(
    (employee) => employee.isActive
  ).length;

  const inactiveCount = employees.length - activeCount;

  if (loading) {
    return (
      <main className="admin-page employee-management-page">
        <div className="admin-page-loading">
          Loading employees...
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page employee-management-page">

      {/* Page Header */}
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">WORKFORCE MANAGEMENT</p>
          <h1>Employee Management</h1>
          <p>Manage employee accounts, roles and access.</p>
        </div>

        <button
          className="admin-primary-button"
          onClick={handleCreate}
        >
          + Add Employee
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
          <span>Total Employees</span>
          <strong>{employees.length}</strong>
        </article>

        <article>
          <span>Active Employees</span>
          <strong>{activeCount}</strong>
        </article>

        <article>
          <span>Inactive Employees</span>
          <strong>{inactiveCount}</strong>
        </article>
      </section>

      {/* Employee Form */}
      {showForm && (
        <section className="announcement-form-card">
          <div className="announcement-form-heading">
            <div>
              <h2>
                {editingId ? "Edit Employee" : "Add New Employee"}
              </h2>

              <p>
                {editingId
                  ? "Update employee account information."
                  : "Create a new employee account."}
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
                <label htmlFor="employee-name">Full Name *</label>

                <input
                  id="employee-name"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Enter employee name"
                  maxLength={100}
                  required
                />
              </div>

              <div className="announcement-field">
                <label htmlFor="employee-email">Email Address *</label>

                <input
                  id="employee-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="employee@company.com"
                  required
                />
              </div>

              {!editingId && (
                <div className="announcement-field">
                  <label htmlFor="employee-password">
                    Temporary Password *
                  </label>

                  <input
                    id="employee-password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleInputChange}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    required
                  />

                  <small>
                    The employee can change their password later.
                  </small>
                </div>
              )}

              <div className="announcement-field">
                <label htmlFor="employee-role">Employee Role *</label>

                
              <CustomSelect
                value={form.role}
                placeholder="Select employee role"
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    role: value,
                  }))
                }
                options={roleOptions}
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
                    : "Create Employee"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Employee Table */}
      <section className="announcement-management-card">

        <div className="announcement-toolbar">
          <div>
            <h2>All Employees</h2>
            <p>View and manage registered employee accounts.</p>
          </div>

          <div className="announcement-filters">
            <input
              type="search"
              placeholder="Search name or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            
            <CustomSelect
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="All Roles"
              options={[
                { value: "all", label: "All Roles" },
                ...roleOptions,
              ]}
            />


            
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Status"
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />

          </div>
        </div>

        <div className="announcement-table-wrapper">
          <table className="announcement-table">

            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="announcement-empty">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee._id || employee.id}>

                    <td>
                      <strong>{employee.name}</strong>
                    </td>

                    <td>{employee.email}</td>

                    <td>
                      <span className="announcement-target-roles">
                        <span>{formatLabel(employee.role)}</span>
                      </span>
                    </td>

                    <td>{formatDate(employee.createdAt)}</td>

                    <td>
                      <span
                        className={`announcement-status ${
                          employee.isActive ? "active" : "inactive"
                        }`}
                      >
                        {employee.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="announcement-actions">

                        <button
                          type="button"
                          onClick={() => handleEdit(employee)}
                        >
                          Edit
                        </button>

                        {employee.isActive ? (
                          <button
                            type="button"
                            className="deactivate-action"
                            onClick={() => handleDeactivate(employee)}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="activate-action"
                            onClick={() => handleReactivate(employee)}
                          >
                            Activate
                          </button>
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
