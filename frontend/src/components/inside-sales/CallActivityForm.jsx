
import { useState } from "react";
import api from "../../services/api.js";
import InterestStatusSelect from "./InterestStatusSelect.jsx";
import "../../styles/pages/call-activity-form.css";

const initialForm = {
  callStatus: "answered",
  duration: "",
  interestStatus: "thinking",
  notes: "",
  followUpDate: "",
};

export default function CallActivityForm({
  customer,
  onSuccess,
  onCancel,
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleInterestChange = (value) => {
    setForm((previous) => ({
      ...previous,
      interestStatus: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customer?._id) {
      setError("Customer information is missing.");
      return;
    }

    const durationMinutes = Number(form.duration || 0);

    if (!Number.isFinite(durationMinutes) || durationMinutes < 0) {
      setError("Please enter a valid call duration.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/call-activities", {
        customerId: customer._id,
        callStatus: form.callStatus,
        duration: Math.round(durationMinutes * 60),
        interestStatus: form.interestStatus,
        notes: form.notes.trim(),
        followUpDate: form.followUpDate
          ? new Date(`${form.followUpDate}T12:00:00`).toISOString()
          : null,
      });

      setSuccess("Call activity recorded successfully.");
      setForm(initialForm);

      if (onSuccess) {
        await onSuccess();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to record this call. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="lm-call-form-card">
      <div className="lm-call-form-heading">
        <div>
          <span className="lm-call-form-eyebrow">
            CUSTOMER COMMUNICATION
          </span>
          <h2>Record a Call</h2>
          <p>
            Save the latest call details for {customer?.name || "this customer"}.
          </p>
        </div>

        <div className="lm-call-form-icon">☎</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="lm-call-form-grid">
          <div className="lm-call-field">
            <label htmlFor="callStatus">Call Outcome *</label>
            <select
              id="callStatus"
              name="callStatus"
              value={form.callStatus}
              onChange={handleChange}
              required
            >
              <option value="answered">Answered</option>
              <option value="not_answered">Not Answered</option>
              <option value="busy">Busy</option>
              <option value="switched_off">Switched Off</option>
              <option value="invalid_number">Invalid Number</option>
            </select>
          </div>

          <div className="lm-call-field">
            <label htmlFor="duration">Call Duration (minutes)</label>
            <input
              id="duration"
              name="duration"
              type="number"
              min="0"
              step="0.5"
              placeholder="Example: 5"
              value={form.duration}
              onChange={handleChange}
            />
          </div>

          <div className="lm-call-field">
            <label htmlFor="interestStatus">Customer Interest *</label>
            <InterestStatusSelect
              value={form.interestStatus}
              onChange={handleInterestChange}
              disabled={saving}
              className="lm-call-interest-select"
            />
          </div>

          <div className="lm-call-field">
            <label htmlFor="followUpDate">Next Follow-up Date</label>
            <input
              id="followUpDate"
              name="followUpDate"
              type="date"
              min={new Date().toLocaleDateString("en-CA")}
              value={form.followUpDate}
              onChange={handleChange}
            />
          </div>

          <div className="lm-call-field lm-call-field-full">
            <label htmlFor="notes">Call Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows="4"
              maxLength="2000"
              placeholder="What did the customer discuss? Note their requirements, questions and next steps..."
              value={form.notes}
              onChange={handleChange}
            />
            <span className="lm-call-character-count">
              {form.notes.length}/2000 characters
            </span>
          </div>
        </div>

        {error && (
          <div className="lm-call-form-message error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="lm-call-form-message success" role="status">
            {success}
          </div>
        )}

        <div className="lm-call-form-actions">
          {onCancel && (
            <button
              type="button"
              className="lm-call-cancel-button"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="lm-call-submit-button"
            disabled={saving}
          >
            {saving ? "Saving Call..." : "Save Call Activity"}
          </button>
        </div>
      </form>
    </section>
  );
}
