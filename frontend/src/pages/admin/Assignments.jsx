
import { useCallback, useEffect, useMemo, useState } from "react";

import customerService from "../../services/customerService.js";
import employeeService from "../../services/employeeService.js";
import assignmentService from "../../services/assignmentService.js";
import CustomSelect from "../../components/common/CustomSelect.jsx";

const formatLabel = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

const getId = (value) =>
  typeof value === "object" && value !== null
    ? value._id || value.id
    : value;

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Assignments() {
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [search, setSearch] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all");

  const [selectedEmployees, setSelectedEmployees] = useState({});
  const [savingId, setSavingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [customerData, employeeData] = await Promise.all([
        customerService.getAllCustomers(),
        employeeService.getAllEmployees(),
      ]);

      const activeCustomers = customerData.filter(
        (customer) =>
          customer.isActive &&
          !["closed", "lost"].includes(customer.status)
      );

      const activeInsideSales = employeeData.filter(
        (employee) =>
          employee.isActive &&
          employee.role === "inside_sales"
      );

      setCustomers(activeCustomers);
      setEmployees(activeInsideSales);

      setSelectedEmployees((previous) => {
        const updated = { ...previous };

        activeCustomers.forEach((customer) => {
          const customerId = customer._id || customer.id;

          if (!(customerId in updated)) {
            updated[customerId] =
              getId(customer.assignedTo) || "";
          }
        });

        return updated;
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load assignment information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEmployeeChange = (customerId, employeeId) => {
    setSelectedEmployees((previous) => ({
      ...previous,
      [customerId]: employeeId,
    }));
  };

  const handleAssign = async (customer) => {
    const customerId = customer._id || customer.id;
    const employeeId = selectedEmployees[customerId];

    if (!employeeId) {
      setError("Please select an Inside Sales employee.");
      return;
    }

    const currentEmployeeId = getId(customer.assignedTo);

    if (currentEmployeeId === employeeId) {
      setError("This customer is already assigned to this employee.");
      return;
    }

    try {
      setSavingId(customerId);
      setError("");
      setSuccess("");

      await assignmentService.assignCustomer(
        customerId,
        employeeId
      );

      const selectedEmployee = employees.find(
        (employee) => (employee._id || employee.id) === employeeId
      );

      setSuccess(
        `${customer.name} has been assigned to ${
          selectedEmployee?.name || "the selected employee"
        }.`
      );

      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to assign this customer."
      );
    } finally {
      setSavingId(null);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        customer.name?.toLowerCase().includes(searchTerm) ||
        customer.phone?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.interestedProperty?.toLowerCase().includes(searchTerm);

      const isAssigned = Boolean(getId(customer.assignedTo));

      const matchesAssignment =
        assignmentFilter === "all" ||
        (assignmentFilter === "assigned" && isAssigned) ||
        (assignmentFilter === "unassigned" && !isAssigned);

      return matchesSearch && matchesAssignment;
    });
  }, [customers, search, assignmentFilter]);

  const totalCustomers = customers.length;

  const assignedCustomers = customers.filter(
    (customer) => Boolean(getId(customer.assignedTo))
  ).length;

  const unassignedCustomers = totalCustomers - assignedCustomers;

  const totalEmployees = employees.length;

  if (loading) {
    return (
      <main className="admin-page assignment-management-page">
        <div className="admin-page-loading">
          Loading customer assignments...
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page assignment-management-page">

      {/* Page Header */}
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">
            CUSTOMER DISTRIBUTION
          </p>

          <h1>Customer Assignments</h1>

          <p>
            Assign customers to Inside Sales employees and manage
            their workload.
          </p>
        </div>
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

      {/* Assignment Statistics */}
      <section className="announcement-stats">
        <article>
          <span>Total Active Customers</span>
          <strong>{totalCustomers}</strong>
        </article>

        <article>
          <span>Assigned Customers</span>
          <strong>{assignedCustomers}</strong>
        </article>

        <article>
          <span>Unassigned Customers</span>
          <strong>{unassignedCustomers}</strong>
        </article>

        <article>
          <span>Active Inside Sales</span>
          <strong>{totalEmployees}</strong>
        </article>
      </section>

      {/* Employee Workload */}
      <section className="announcement-management-card">
        <div className="announcement-toolbar">
          <div>
            <h2>Inside Sales Workload</h2>
            <p>
              Current active customer assignments for each employee.
            </p>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="announcement-empty">
            No active Inside Sales employees found.
          </div>
        ) : (
          <div className="announcement-stats">
            {employees.map((employee) => {
              const employeeId = employee._id || employee.id;

              const workload = customers.filter(
                (customer) =>
                  getId(customer.assignedTo) === employeeId
              ).length;

              return (
                <article key={employeeId}>
                  <span>{employee.name}</span>
                  <strong>{workload}</strong>
                  <small>Assigned customers</small>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Customer Assignment Table */}
      <section className="announcement-management-card">

        <div className="announcement-toolbar">
          <div>
            <h2>Customer Assignment List</h2>
            <p>
              Assign or reassign active customers to Inside Sales.
            </p>
          </div>

          <div className="announcement-filters">

            <input
              type="search"
              placeholder="Search customer..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

        <CustomSelect
            value={assignmentFilter}
            placeholder="All Customers"
            onChange={(value) => setAssignmentFilter(value)}
            options={[
                { value: "all", label: "All Customers" },
                { value: "assigned", label: "Assigned" },
                { value: "unassigned", label: "Unassigned" },
            ]}
            />

          </div>
        </div>

        <div className="announcement-table-wrapper">
          <table className="announcement-table">

            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Interested Property</th>
                <th>Sales Status</th>
                <th>Assigned Employee</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="announcement-empty">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const customerId = customer._id || customer.id;
                  const currentEmployeeId = getId(customer.assignedTo);
                  const selectedEmployeeId =
                    selectedEmployees[customerId] || "";

                  const isSaving = savingId === customerId;

                  return (
                    <tr key={customerId}>

                      <td>
                        <strong>{customer.name}</strong>

                        {customer.email && (
                          <small className="customer-table-email">
                            {customer.email}
                          </small>
                        )}
                      </td>

                      <td>{customer.phone || "—"}</td>

                      <td>
                        {customer.interestedProperty || "—"}
                      </td>

                      <td>
                        <span className="announcement-status pending">
                          {formatLabel(customer.status)}
                        </span>
                      </td>

                      <td>
                       
                    <CustomSelect
                        value={selectedEmployeeId}
                        placeholder="Select employee"
                        disabled={isSaving || employees.length === 0}
                        onChange={(employeeId) =>
                            handleEmployeeChange(customerId, employeeId)
                        }
                        options={employees.map((employee) => ({
                            value: employee._id || employee.id,
                            label: employee.name,
                        }))}
                        />

                        {currentEmployeeId && (
                          <small>
                            Currently assigned
                          </small>
                        )}
                      </td>

                      <td>
                        <div className="announcement-actions">
                          <button
                            type="button"
                            onClick={() => handleAssign(customer)}
                            disabled={
                              isSaving ||
                              !selectedEmployeeId ||
                              selectedEmployeeId === currentEmployeeId ||
                              employees.length === 0
                            }
                          >
                            {isSaving
                              ? "Saving..."
                              : currentEmployeeId
                                ? "Reassign"
                                : "Assign"}
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

      </section>

      <div className="announcement-toolbar">
        <small>
          Showing {filteredCustomers.length} of {totalCustomers} active
          customers · Updated {formatDate(new Date())}
        </small>
      </div>

    </main>
  );
}
