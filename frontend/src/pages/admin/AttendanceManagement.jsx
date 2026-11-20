import { useCallback, useEffect, useMemo, useState } from "react";
import attendanceService from "../../services/attendanceService.js";
import "../../styles/pages/attendance-management.css";

const today = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  return parts;
};
const monthStart = () => `${today().slice(0, 7)}-01`;
const formatDate = (value) => value ? new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric",
}).format(new Date(`${value}T00:00:00+05:30`)) : "—";
const formatTime = (value) => value ? new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true,
}).format(new Date(value)) : "—";
const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(value || 0);
const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const roleLabel = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

function Metric({ label, value, helper, tone }) {
  return (
    <article className={`attendance-report-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

export default function AttendanceManagement() {
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [employeeId, setEmployeeId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await attendanceService.getAdminReport({ from, to, ...(employeeId ? { employeeId } : {}) });
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load attendance reports. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [from, to, employeeId]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const summary = report?.summary || {};
  const records = report?.records || [];
  const employees = report?.employees || [];
  const daily = report?.daily || [];

  const totalHours = useMemo(() => {
    const minutes = summary.totalWorkedMinutes || 0;
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
  }, [summary.totalWorkedMinutes]);

  const exportCsv = () => {
    const headings = ["Date", "Employee", "Email", "Role", "First Login", "Last Logout", "Worked Duration", "Late By", "Early By", "Sessions", "Status"];
    const rows = records.map((row) => [row.date, row.employeeName, row.employeeEmail, roleLabel(row.role), formatTime(row.firstLogin), formatTime(row.lastLogout), row.workedDuration, row.lateBy, row.earlyBy, row.sessions, row.attendanceStatus]);
    const csv = [headings, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `luminest-attendance-${from}-to-${to}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="attendance-report-page">
      <header className="attendance-report-header">
        <div>
          <p className="attendance-report-eyebrow">WORKFORCE MANAGEMENT</p>
          <h1>Attendance Reports</h1>
          <p>Daily and monthly attendance, working hours and punctuality overview.</p>
        </div>
        <div className="attendance-shift-chip"><span>OFFICE SHIFT</span><strong>9:30 AM – 6:30 PM</strong><small>India Standard Time</small></div>
      </header>

      <section className="attendance-report-filters">
        <label>From date<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} /></label>
        <label>To date<input type="date" value={to} min={from} max={today()} onChange={(event) => setTo(event.target.value)} /></label>
        <label className="attendance-employee-filter">Employee<select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}><option value="">All employees</option>{(report?.employeeOptions || []).map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {roleLabel(employee.role)}</option>)}</select></label>
        <button type="button" className="attendance-filter-button" onClick={loadReport} disabled={loading}> {loading ? "Refreshing…" : "Refresh report"}</button>
      </section>

      {error && <div className="attendance-report-error" role="alert">{error}</div>}
      {loading && !report ? <div className="attendance-report-loading">Loading attendance data…</div> : (
        <>
          <section className="attendance-report-metrics">
            <Metric label="Employees Present" value={formatNumber(summary.employeesPresent)} helper={`${formatNumber(summary.totalEmployees)} employees in team`} tone="blue" />
            <Metric label="Late Arrivals" value={formatNumber(summary.lateArrivals)} helper="First login after 9:30 AM" tone="orange" />
            <Metric label="Early Departures" value={formatNumber(summary.earlyDepartures)} helper="Last logout before 6:30 PM" tone="purple" />
            <Metric label="Total Working Time" value={totalHours} helper={`${formatNumber(summary.attendanceDays)} employee-days`} tone="green" />
          </section>

          <section className="attendance-report-panel">
            <div className="attendance-report-panel-heading"><div><h2>Daily Attendance Summary</h2><p>Present count, late arrivals and early departures per day</p></div></div>
            <div className="attendance-report-table-scroll"><table className="attendance-report-table"><thead><tr><th>Date</th><th>Present</th><th>Late</th><th>Early departures</th><th>Working time</th></tr></thead><tbody>
              {daily.length ? daily.map((day) => <tr key={day.date}><td>{formatDate(day.date)}</td><td>{day.present}</td><td>{day.late}</td><td>{day.early}</td><td>{day.workedDuration}</td></tr>) : <tr><td colSpan="5" className="attendance-report-empty">No attendance data for this date range.</td></tr>}
            </tbody></table></div>
          </section>

          <section className="attendance-report-panel">
            <div className="attendance-report-panel-heading"><div><h2>Employee-wise Monthly Summary</h2><p>Attendance days and total recorded working time in the selected period</p></div></div>
            <div className="attendance-report-table-scroll"><table className="attendance-report-table"><thead><tr><th>Employee</th><th>Role</th><th>Days present</th><th>Late days</th><th>Early departures</th><th>Working time</th></tr></thead><tbody>
              {employees.length ? employees.map((employee) => <tr key={employee.employeeId}><td><strong>{employee.employeeName}</strong><small className="attendance-report-subtext">{employee.employeeEmail}</small></td><td>{roleLabel(employee.role)}</td><td>{employee.daysPresent}</td><td>{employee.lateDays}</td><td>{employee.earlyDepartures}</td><td>{employee.workedDuration}</td></tr>) : <tr><td colSpan="6" className="attendance-report-empty">No employee summary available.</td></tr>}
            </tbody></table></div>
          </section>

          <section className="attendance-report-panel attendance-detail-panel">
            <div className="attendance-report-panel-heading attendance-detail-heading"><div><h2>Attendance History</h2><p>Individual attendance sessions grouped by employee and day</p></div><div className="attendance-export-actions"><button type="button" onClick={exportCsv} disabled={!records.length}>Export Excel (CSV)</button><button type="button" onClick={() => window.print()}>Print / Save PDF</button></div></div>
            <div className="attendance-report-table-scroll"><table className="attendance-report-table"><thead><tr><th>Date</th><th>Employee</th><th>First login</th><th>Last logout</th><th>Working time</th><th>Late by</th><th>Early by</th><th>Status</th></tr></thead><tbody>
              {records.length ? records.map((row) => <tr key={`${row.employeeId}-${row.date}`}><td>{formatDate(row.date)}</td><td><strong>{row.employeeName}</strong><small className="attendance-report-subtext">{row.employeeEmail}</small></td><td>{formatTime(row.firstLogin)}</td><td>{formatTime(row.lastLogout)}</td><td>{row.workedDuration}</td><td><span className={row.lateMinutes ? "attendance-flag warning" : "attendance-flag good"}>{row.lateBy}</span></td><td><span className={row.earlyMinutes ? "attendance-flag warning" : "attendance-flag good"}>{row.earlyBy}</span></td><td><span className={`attendance-session-status ${row.active ? "active" : "closed"}`}>{row.attendanceStatus}</span></td></tr>) : <tr><td colSpan="8" className="attendance-report-empty">No attendance records found for the selected filters.</td></tr>}
            </tbody></table></div>
          </section>
          <p className="attendance-report-footnote">Attendance calculations use India Standard Time. Late arrival is measured after 9:30 AM; early departure is measured before 6:30 PM. Working time is calculated from recorded login/logout timestamps.</p>
        </>
      )}
    </main>
  );
}
