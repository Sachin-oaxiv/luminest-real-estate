import { useCallback, useEffect, useMemo, useState } from "react";
import employeeService from "../../services/employeeService.js";
import "../../styles/pages/executive-employees.css";

const emptyForm = { name: "", email: "", password: "" };

export default function ExecutiveEmployees() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      setEmployees(await employeeService.getAllEmployees());
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load Inside Sales employees.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };
  const edit = (employee) => {
    setForm({ name: employee.name || "", email: employee.email || "", password: "" });
    setEditingId(employee._id || employee.id); setShowForm(true); setError(""); setSuccess("");
  };
  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const payload = { name: form.name.trim(), email: form.email.trim().toLowerCase() };
      if (editingId) {
        await employeeService.updateEmployee(editingId, payload);
        setSuccess("Inside Sales employee updated successfully.");
      } else {
        if (form.password.length < 8) { setError("Password must contain at least 8 characters."); setSaving(false); return; }
        await employeeService.createEmployee({ ...payload, password: form.password, role: "inside_sales" });
        setSuccess("Inside Sales employee created successfully.");
      }
      reset(); await load();
    } catch (e) { setError(e.response?.data?.message || "Unable to save employee."); }
    finally { setSaving(false); }
  };
  const toggleActive = async (employee) => {
    const id = employee._id || employee.id;
    const action = employee.isActive ? "deactivate" : "reactivate";
    if (!window.confirm(`${action === "deactivate" ? "Deactivate" : "Reactivate"} ${employee.name}?`)) return;
    try {
      setError(""); setSuccess("");
      if (action === "deactivate") await employeeService.deactivateEmployee(id);
      else await employeeService.reactivateEmployee(id);
      setSuccess(`${employee.name} ${action}d successfully.`); await load();
    } catch (e) { setError(e.response?.data?.message || "Unable to update employee status."); }
  };
  const visible = useMemo(() => employees.filter(x =>
    (`${x.name || ""} ${x.email || ""}`).toLowerCase().includes(search.toLowerCase()) &&
    (status === "all" || (status === "active" ? x.isActive : !x.isActive))
  ), [employees, search, status]);
  const active = employees.filter(x => x.isActive).length;

  return <main className="ex-employee-page">
    <header className="ex-employee-header">
      <div><p className="ex-employee-eyebrow">TEAM MANAGEMENT</p><h1>Inside Sales Employees</h1>
        <p>Manage your Inside Sales team and account status.</p></div>
      <button className="ex-employee-primary" onClick={() => { reset(); setShowForm(true); setError(""); setSuccess(""); }}>＋ Add Employee</button>
    </header>
    {error && <div className="ex-employee-alert error">{error}</div>}
    {success && <div className="ex-employee-alert success">{success}</div>}
    <section className="ex-employee-stats">
      <article><span>Total Inside Sales</span><strong>{employees.length}</strong></article>
      <article><span>Active</span><strong>{active}</strong></article>
      <article><span>Inactive</span><strong>{employees.length-active}</strong></article>
    </section>
    {showForm && <section className="ex-employee-form-card">
      <div className="ex-employee-form-title"><div><h2>{editingId ? "Edit Employee" : "Add Inside Sales Employee"}</h2><p>{editingId ? "Update employee information." : "Create a new Inside Sales login."}</p></div>
        <button type="button" onClick={reset} className="ex-employee-secondary">Close</button></div>
      <form onSubmit={submit} className="ex-employee-form">
        <label>Full name<input required maxLength={100} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Employee name"/></label>
        <label>Email address<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="employee@company.com"/></label>
        {!editingId && <label>Temporary password<input required minLength={8} type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Minimum 8 characters"/></label>}
        <div className="ex-employee-form-actions"><button type="button" className="ex-employee-secondary" onClick={reset}>Cancel</button><button disabled={saving} className="ex-employee-primary">{saving ? "Saving..." : editingId ? "Save Changes" : "Create Employee"}</button></div>
      </form>
    </section>}
    <section className="ex-employee-table-card">
      <div className="ex-employee-toolbar"><div><h2>Team Directory</h2><p>{visible.length} employee(s)</p></div>
        <input type="search" placeholder="Search name or email..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
      </div>
      {loading ? <p className="ex-employee-empty">Loading employees...</p> : visible.length === 0 ? <p className="ex-employee-empty">No Inside Sales employees found.</p> :
      <div className="ex-employee-table-wrap"><table className="ex-employee-table"><thead><tr><th>Employee</th><th>Email</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
        {visible.map(employee=><tr key={employee._id || employee.id}><td><strong>{employee.name}</strong></td><td>{employee.email}</td><td><span className={`ex-employee-status ${employee.isActive ? "on" : "off"}`}>{employee.isActive ? "Active" : "Inactive"}</span></td><td>{employee.createdAt ? new Date(employee.createdAt).toLocaleDateString("en-IN") : "—"}</td><td><div className="ex-employee-actions"><button onClick={()=>edit(employee)}>Edit</button><button className={employee.isActive ? "danger" : "activate"} onClick={()=>toggleActive(employee)}>{employee.isActive ? "Deactivate" : "Reactivate"}</button></div></td></tr>)}
      </tbody></table></div>}
    </section>
  </main>;
}
