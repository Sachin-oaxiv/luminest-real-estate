import { useEffect, useMemo, useState } from "react";
import employeeService from "../../services/employeeService.js";
import permissionService from "../../services/permissionService.js";

const TYPES = [
  ["work_from_home", "Work From Home"],
  ["outside_work", "Outside Work"],
  ["temporary_extension", "Temporary Extension"],
  ["full_day", "Full Day"],
];
const localDateTime = (date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

export default function SpecialPermissions() {
  const [employees, setEmployees] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [form, setForm] = useState({ employeeId: "", type: "work_from_home", reason: "", startAt: localDateTime(new Date()), endAt: localDateTime(new Date(Date.now() + 4 * 60 * 60 * 1000)) });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [staff, rows] = await Promise.all([employeeService.getAllEmployees(), permissionService.getAll()]);
      setEmployees(staff.filter((e) => e.role === "inside_sales" && e.isActive !== false));
      setPermissions(rows);
    } catch (e) { setError(e.response?.data?.message || "Unable to load permissions."); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      await permissionService.grant({ ...form, startAt: new Date(form.startAt).toISOString(), endAt: new Date(form.endAt).toISOString() });
      setMessage("Special permission approved successfully.");
      setForm((f) => ({ ...f, reason: "" }));
      await load();
    } catch (e) { setError(e.response?.data?.message || "Unable to approve permission."); }
    finally { setBusy(false); }
  };
  const revoke = async (id) => {
    if (!window.confirm("Revoke this special permission immediately?")) return;
    try { await permissionService.revoke(id); setMessage("Permission revoked."); await load(); }
    catch (e) { setError(e.response?.data?.message || "Unable to revoke permission."); }
  };
  const label = (type) => TYPES.find((x) => x[0] === type)?.[1] || type;
  const statusOf = (p) => p.status === "revoked" ? "Revoked" : new Date(p.endAt) <= new Date() ? "Expired" : new Date(p.startAt) > new Date() ? "Scheduled" : "Active";

  return (
    <main className="special-permissions-page" style={{ padding: 28, color: "#20304a" }}>
      <header style={{ marginBottom: 22 }}>
        <p style={{ color: "#7b8aa2", fontSize: 11, fontWeight: 800, letterSpacing: 1.5 }}>GPS ACCESS CONTROL</p>
        <h1 style={{ margin: "4px 0", fontSize: 28 }}>Special Permissions</h1>
        <p style={{ color: "#7b8aa2" }}>Approve time-limited location exceptions for Inside Sales employees.</p>
      </header>
      {message && <p role="status" style={{ padding: 12, background: "#eaf8ef", color: "#247447", borderRadius: 8 }}>{message}</p>}
      {error && <p role="alert" style={{ padding: 12, background: "#fff0f0", color: "#a33e3e", borderRadius: 8 }}>{error}</p>}
      <section style={{ background: "#fff", border: "1px solid #e3e9f1", borderRadius: 14, padding: 22, marginBottom: 22 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Grant special permission</h2>
        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          <label>Inside Sales employee<select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} style={fieldStyle}><option value="">Select employee</option>{employees.map((e) => <option key={e._id || e.id} value={e._id || e.id}>{e.name} ({e.email})</option>)}</select></label>
          <label>Permission type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={fieldStyle}>{TYPES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
          <label>Start date & time<input required type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} style={fieldStyle}/></label>
          <label>Expiry date & time<input required type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} style={fieldStyle}/></label>
          <label style={{ gridColumn: "1 / -1" }}>Reason<textarea required maxLength={500} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Explain why this employee needs an exception..." style={{ ...fieldStyle, minHeight: 85, paddingTop: 10 }}/></label>
          <div style={{ gridColumn: "1 / -1" }}><button disabled={busy || !employees.length} style={buttonStyle}>{busy ? "Approving..." : "Approve permission"}</button>{!employees.length && <span style={{ marginLeft: 12, color: "#9a6b20" }}>No active Inside Sales employees found.</span>}</div>
        </form>
      </section>
      <section style={{ background: "#fff", border: "1px solid #e3e9f1", borderRadius: 14, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}><h2 style={{ margin: 0, fontSize: 18 }}>Permission history</h2><button type="button" onClick={load} style={buttonStyle}>Refresh</button></div>
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table style={{ width: "100%", minWidth: 850, borderCollapse: "collapse", textAlign: "left" }}>
            <thead><tr>{["Employee", "Type", "Reason", "Start", "Expiry", "Status", "Approved by", "Action"].map((x) => <th key={x} style={thStyle}>{x}</th>)}</tr></thead>
            <tbody>{permissions.map((p) => <tr key={p._id}><td style={tdStyle}>{p.employee?.name || "Employee"}</td><td style={tdStyle}>{label(p.type)}</td><td style={tdStyle}>{p.reason}</td><td style={tdStyle}>{new Date(p.startAt).toLocaleString()}</td><td style={tdStyle}>{new Date(p.endAt).toLocaleString()}</td><td style={tdStyle}>{statusOf(p)}</td><td style={tdStyle}>{p.approvedBy?.name || "—"}</td><td style={tdStyle}>{statusOf(p) === "Active" || statusOf(p) === "Scheduled" ? <button onClick={() => revoke(p._id)} style={{ ...buttonStyle, background: "#fff", color: "#a33e3e", border: "1px solid #efcccc" }}>Revoke</button> : "—"}</td></tr>)}{!permissions.length && <tr><td colSpan="8" style={{ ...tdStyle, textAlign: "center", color: "#8290a6" }}>No permissions have been created.</td></tr>}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
const fieldStyle = { display: "block", width: "100%", marginTop: 7, minHeight: 42, border: "1px solid #dce4ee", borderRadius: 8, padding: "8px 11px", font: "inherit", background: "#fbfcfe" };
const buttonStyle = { border: 0, borderRadius: 8, padding: "11px 16px", background: "#233b60", color: "#fff", fontWeight: 700, cursor: "pointer" };
const thStyle = { padding: 12, background: "#f6f8fb", color: "#71819a", fontSize: 11, whiteSpace: "nowrap" };
const tdStyle = { padding: 12, borderTop: "1px solid #edf1f6", fontSize: 12, color: "#40516b", verticalAlign: "top" };
