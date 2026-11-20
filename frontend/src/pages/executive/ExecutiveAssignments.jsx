import { useCallback, useEffect, useMemo, useState } from "react";
import assignmentService from "../../services/assignmentService.js";
import employeeService from "../../services/employeeService.js";
import "../../styles/pages/executive-assignments.css";

const getId = (value) => typeof value === "object" && value !== null ? value._id || value.id : value;
const label = (value = "") => String(value).replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const dateText = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const isOverdue = (value) => value && new Date(value).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

export default function ExecutiveAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (quiet = false) => {
    try {
      if (quiet) setRefreshing(true); else setLoading(true);
      setError("");
      const [assignmentRows, employeeRows] = await Promise.all([
        assignmentService.getAllAssignments(),
        employeeService.getAllEmployees(),
      ]);
      setAssignments(Array.isArray(assignmentRows) ? assignmentRows : []);
      setEmployees(Array.isArray(employeeRows) ? employeeRows.filter((x) => x.role === "inside_sales" && x.isActive) : []);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load assignment monitoring data.");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const employeeCounts = useMemo(() => employees.map((employee) => {
    const id = getId(employee);
    const rows = assignments.filter((customer) => getId(customer.assignedTo) === id);
    return { ...employee, workload: rows.length, followUps: rows.filter((x) => x.followUpDate).length };
  }), [employees, assignments]);

  const visible = useMemo(() => assignments.filter((customer) => {
    const employee = customer.assignedTo || {};
    const haystack = `${customer.name || ""} ${customer.phone || ""} ${customer.email || ""} ${customer.interestedProperty || ""} ${employee.name || ""}`.toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesEmployee = employeeFilter === "all" || getId(employee) === employeeFilter;
    const overdue = isOverdue(customer.followUpDate);
    const matchesFollowUp = followUpFilter === "all" || (followUpFilter === "overdue" && overdue) || (followUpFilter === "upcoming" && customer.followUpDate && !overdue) || (followUpFilter === "none" && !customer.followUpDate);
    return matchesSearch && matchesEmployee && matchesFollowUp;
  }), [assignments, search, employeeFilter, followUpFilter]);

  const overdueCount = assignments.filter((x) => isOverdue(x.followUpDate)).length;
  const scheduledCount = assignments.filter((x) => x.followUpDate && !isOverdue(x.followUpDate)).length;
  const unassignedCount = 0; // This view is based on the assigned-customer endpoint.

  if (loading) return <main className="ex-assignment-page"><div className="ex-assignment-loading">Loading assignment monitoring...</div></main>;

  return <main className="ex-assignment-page">
    <header className="ex-assignment-header">
      <div><p className="ex-assignment-eyebrow">TEAM PERFORMANCE</p><h1>Assignment Monitoring</h1><p>Track customer allocation, employee workload, and follow-up activity.</p></div>
      <button className="ex-assignment-refresh" onClick={() => load(true)} disabled={refreshing}>{refreshing ? "Refreshing..." : "↻ Refresh"}</button>
    </header>
    {error && <div className="ex-assignment-alert">{error}</div>}

    <section className="ex-assignment-stats">
      <article><span>Assigned Customers</span><strong>{assignments.length}</strong><small>Currently active assignments</small></article>
      <article><span>Active Inside Sales</span><strong>{employees.length}</strong><small>Available team members</small></article>
      <article><span>Overdue Follow-ups</span><strong>{overdueCount}</strong><small>Follow-up date has passed</small></article>
      <article><span>Upcoming Follow-ups</span><strong>{scheduledCount}</strong><small>Scheduled for today or later</small></article>
    </section>

    <section className="ex-assignment-card">
      <div className="ex-assignment-section-heading"><div><h2>Employee Workload</h2><p>Number of active customers assigned to each Inside Sales employee.</p></div></div>
      {employeeCounts.length ? <div className="ex-assignment-workloads">{employeeCounts.map((employee) => <article key={getId(employee)}><div className="ex-assignment-avatar">{(employee.name || "I").slice(0, 1).toUpperCase()}</div><div className="ex-assignment-employee-info"><strong>{employee.name}</strong><small>{employee.email}</small><div className="ex-assignment-progress"><span style={{ width: `${assignments.length ? Math.max(4, employee.workload / Math.max(1, ...employeeCounts.map((x) => x.workload)) * 100) : 0}%` }} /></div></div><div className="ex-assignment-workload-count"><strong>{employee.workload}</strong><small>customers</small></div></article>)}</div> : <div className="ex-assignment-empty">No active Inside Sales employees found.</div>}
    </section>

    <section className="ex-assignment-card">
      <div className="ex-assignment-section-heading"><div><h2>Assigned Customer Overview</h2><p>Search and filter the current customer assignments.</p></div></div>
      <div className="ex-assignment-filters">
        <input type="search" placeholder="Search customer, phone, property, employee..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}><option value="all">All employees</option>{employees.map((employee) => <option key={getId(employee)} value={getId(employee)}>{employee.name}</option>)}</select>
        <select value={followUpFilter} onChange={(e) => setFollowUpFilter(e.target.value)}><option value="all">All follow-ups</option><option value="overdue">Overdue</option><option value="upcoming">Scheduled</option><option value="none">No follow-up</option></select>
      </div>
      <div className="ex-assignment-table-wrap"><table className="ex-assignment-table"><thead><tr><th>Customer</th><th>Interested Property</th><th>Assigned Employee</th><th>Sales Status</th><th>Interest</th><th>Next Follow-up</th></tr></thead><tbody>
        {visible.length ? visible.map((customer) => <tr key={getId(customer)}><td><strong>{customer.name || "—"}</strong><small>{customer.phone || customer.email || ""}</small></td><td>{customer.interestedProperty || "—"}</td><td><strong>{customer.assignedTo?.name || "—"}</strong><small>{customer.assignedTo?.email || ""}</small></td><td><span className="ex-assignment-tag">{label(customer.status || "new")}</span></td><td>{label(customer.interestStatus || "not updated")}</td><td><span className={isOverdue(customer.followUpDate) ? "ex-assignment-date overdue" : "ex-assignment-date"}>{dateText(customer.followUpDate)}</span>{isOverdue(customer.followUpDate) && <small className="ex-assignment-overdue-label">Overdue</small>}</td></tr>) : <tr><td colSpan="6" className="ex-assignment-empty">No assignments match your filters.</td></tr>}
      </tbody></table></div>
      <div className="ex-assignment-table-footer">Showing {visible.length} of {assignments.length} assigned customers</div>
    </section>
  </main>;
}
