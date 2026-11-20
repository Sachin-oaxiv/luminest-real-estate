
import { useCallback, useEffect, useState } from "react";
import announcementService from "../../services/announcementService.js";

const initialForm = {
  title: "",
  message: "",
  targetRoles: [
    "admin",
    "executive",
    "inside_sales",
    "outside_sales",
  ],
  priority: "normal",
  expiresAt: "",
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
  if (!value) return "No expiry";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await announcementService.getAllAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load announcements."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleRoleChange = (role) => {
    setForm((previous) => {
      const selected = previous.targetRoles.includes(role);

      return {
        ...previous,
        targetRoles: selected
          ? previous.targetRoles.filter((item) => item !== role)
          : [...previous.targetRoles, role],
      };
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    setForm(initialForm);
    setEditingId(null);
    setSuccess("");
    setError("");
    setShowForm(true);
  };

  const handleEdit = (announcement) => {
    setForm({
      title: announcement.title,
      message: announcement.message,
      targetRoles: announcement.targetRoles || [],
      priority: announcement.priority || "normal",
      expiresAt: announcement.expiresAt
        ? new Date(announcement.expiresAt)
            .toISOString()
            .slice(0, 10)
        : "",
    });

    setEditingId(announcement._id);
    setShowForm(true);
    setSuccess("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.targetRoles.length === 0) {
      setError("Please select at least one target role.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        ...form,
        expiresAt: form.expiresAt
          ? new Date(`${form.expiresAt}T23:59:59`).toISOString()
          : null,
      };

      if (editingId) {
        await announcementService.updateAnnouncement(
          editingId,
          payload
        );
        setSuccess("Announcement updated successfully.");
      } else {
        await announcementService.createAnnouncement(payload);
        setSuccess("Announcement created successfully.");
      }

      resetForm();
      await fetchAnnouncements();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save announcement."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (announcement) => {
    const action = announcement.isActive ? "deactivate" : "activate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} this announcement?`
      )
    ) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await announcementService.updateAnnouncement(
        announcement._id,
        { isActive: !announcement.isActive }
      );

      setSuccess(`Announcement ${action}d successfully.`);
      await fetchAnnouncements();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update announcement status."
      );
    }
  };

  const filteredAnnouncements = announcements.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.message.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && item.isActive) ||
      (filter === "inactive" && !item.isActive);

    return matchesSearch && matchesFilter;
  });

  const activeCount = announcements.filter(
    (item) => item.isActive
  ).length;

  const inactiveCount = announcements.length - activeCount;

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-page-loading">
          Loading announcements...
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">COMMUNICATION</p>
          <h1>Announcements</h1>
          <p>
            Create and manage important company announcements.
          </p>
        </div>

        <button
          className="admin-primary-button"
          onClick={handleCreate}
        >
          + Create Announcement
        </button>
      </header>

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

      <section className="announcement-stats">
        <article>
          <span>Total Announcements</span>
          <strong>{announcements.length}</strong>
        </article>

        <article>
          <span>Active</span>
          <strong>{activeCount}</strong>
        </article>

        <article>
          <span>Inactive</span>
          <strong>{inactiveCount}</strong>
        </article>
      </section>

      {showForm && (
        <section className="announcement-form-card">
          <div className="announcement-form-heading">
            <div>
              <h2>
                {editingId
                  ? "Edit Announcement"
                  : "Create Announcement"}
              </h2>
              <p>
                Enter the announcement details below.
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
              <div className="announcement-field full-width">
                <label htmlFor="announcement-title">
                  Announcement Title *
                </label>

                <input
                  id="announcement-title"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  maxLength={150}
                  placeholder="Enter announcement title"
                  required
                />
              </div>

              <div className="announcement-field full-width">
                <label htmlFor="announcement-message">
                  Message *
                </label>

                <textarea
                  id="announcement-message"
                  name="message"
                  value={form.message}
                  onChange={handleInputChange}
                  maxLength={2000}
                  rows={5}
                  placeholder="Write your announcement..."
                  required
                />

                <small>{form.message.length}/2000 characters</small>
              </div>

              <div className="announcement-field">
                <label htmlFor="announcement-priority">
                  Priority
                </label>

                <select
                  id="announcement-priority"
                  name="priority"
                  value={form.priority}
                  onChange={handleInputChange}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="announcement-field">
                <label htmlFor="announcement-expiry">
                  Expiry Date
                </label>

                <input
                  id="announcement-expiry"
                  name="expiresAt"
                  type="date"
                  min={new Date().toLocaleDateString("en-CA")}
                  value={form.expiresAt}
                  onChange={handleInputChange}
                />

                <small>Leave empty for no expiry.</small>
              </div>
            </div>

            <div className="announcement-field">
              <label>Target Employee Roles *</label>

              <div className="announcement-role-options">
                {roleOptions.map((role) => (
                  <label
                    className="announcement-role-option"
                    key={role.value}
                  >
                    <input
                      type="checkbox"
                      checked={form.targetRoles.includes(role.value)}
                      onChange={() => handleRoleChange(role.value)}
                    />

                    <span>{role.label}</span>
                  </label>
                ))}
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
                    : "Publish Announcement"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="announcement-management-card">
        <div className="announcement-toolbar">
          <div>
            <h2>All Announcements</h2>
            <p>Manage your published and inactive announcements.</p>
          </div>

          <div className="announcement-filters">
            <input
              type="search"
              placeholder="Search announcements..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="announcement-table-wrapper">
          <table className="announcement-table">
            <thead>
              <tr>
                <th>Announcement</th>
                <th>Priority</th>
                <th>Target Roles</th>
                <th>Posted By</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAnnouncements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="announcement-empty">
                    No announcements found.
                  </td>
                </tr>
              ) : (
                filteredAnnouncements.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.title}</strong>
                      <p>{item.message}</p>
                      <small>{formatDate(item.createdAt)}</small>
                    </td>

                    <td>
                      <span
                        className={`announcement-priority priority-${item.priority}`}
                      >
                        {formatLabel(item.priority)}
                      </span>
                    </td>

                    <td>
                      <div className="announcement-target-roles">
                        {item.targetRoles.map((role) => (
                          <span key={role}>
                            {formatLabel(role)}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>{item.createdBy?.name || "Admin"}</td>

                    <td>{formatDate(item.expiresAt)}</td>

                    <td>
                      <span
                        className={`announcement-status ${
                          item.isActive ? "active" : "inactive"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="announcement-actions">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className={
                            item.isActive
                              ? "deactivate-action"
                              : "activate-action"
                          }
                          onClick={() => handleToggleActive(item)}
                        >
                          {item.isActive ? "Deactivate" : "Activate"}
                        </button>
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
