
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api.js";
import "../../styles/pages/visit-scheduler.css";

const INITIAL_FORM = {
  propertyName: "",
  propertyAddress: "",
  scheduledDate: "",
  assignedTo: "",
  notes: "",
};

export default function VisitScheduler({ customer, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      setError("");

      const response = await api.get("/visits/outside-sales-employees");
      setEmployees(response.data.employees || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load Outside Sales employees."
      );
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!customer?._id) {
      setError("Customer information is missing.");
      return;
    }

    if (!form.assignedTo) {
      setError("Please select an Outside Sales employee.");
      return;
    }

    if (!form.scheduledDate) {
      setError("Please select a visit date and time.");
      return;
    }

    const scheduledDate = new Date(form.scheduledDate);

    if (
      Number.isNaN(scheduledDate.getTime()) ||
      scheduledDate <= new Date()
    ) {
      setError("Please select a future date and time.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post("/visits", {
        customerId: customer._id,
        assignedTo: form.assignedTo,
        propertyName: form.propertyName.trim(),
        propertyAddress: form.propertyAddress.trim(),
        scheduledDate: scheduledDate.toISOString(),
        notes: form.notes.trim(),
      });

      setSuccess(
        response.data.message || "Property visit scheduled successfully."
      );

      setForm(INITIAL_FORM);

      if (onSuccess) {
        onSuccess(response.data.visit);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to schedule this property visit."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="lm-visit-scheduler">
      <div className="lm-visit-scheduler-header">
        <div>
          <span className="lm-visit-scheduler-eyebrow">
            PROPERTY VISITS
          </span>
          <h2>Schedule a Property Visit</h2>
          <p>
            Assign a property visit to an Outside Sales employee.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            className="lm-visit-scheduler-close"
            onClick={onClose}
            aria-label="Close visit scheduler"
          >
            ×
          </button>
        )}
      </div>

      <div className="lm-visit-customer-summary">
        <span className="lm-visit-customer-avatar">
          {customer?.name?.charAt(0)?.toUpperCase() || "C"}
        </span>

        <div>
          <span>VISIT FOR CUSTOMER</span>
          <strong>{customer?.name || "Customer"}</strong>
          <small>{customer?.phone || "No phone number available"}</small>
        </div>
      </div>

      <form className="lm-visit-scheduler-form" onSubmit={handleSubmit}>
        <div className="lm-visit-form-section-title">
          <span>01</span>
          <div>
            <h3>Property Details</h3>
            <p>Enter the property information for the visit.</p>
          </div>
        </div>

        <div className="lm-visit-form-grid">
          <label className="lm-visit-field lm-visit-field-full">
            <span>Property Name</span>
            <input
              type="text"
              name="propertyName"
              value={form.propertyName}
              onChange={handleChange}
              placeholder="e.g. Green Valley Apartments"
              required
              maxLength={150}
            />
          </label>

          <label className="lm-visit-field lm-visit-field-full">
            <span>Property Address</span>
            <textarea
              name="propertyAddress"
              value={form.propertyAddress}
              onChange={handleChange}
              placeholder="Enter the complete property address"
              rows={3}
              required
              maxLength={500}
            />
          </label>
        </div>

        <div className="lm-visit-form-section-title">
          <span>02</span>
          <div>
            <h3>Visit Assignment</h3>
            <p>Choose the employee and preferred visit time.</p>
          </div>
        </div>

        <div className="lm-visit-form-grid">
          <label className="lm-visit-field">
            <span>Outside Sales Employee</span>
            <select
              name="assignedTo"
              value={form.assignedTo}
              onChange={handleChange}
              disabled={loadingEmployees || employees.length === 0}
              required
            >
              <option value="">
                {loadingEmployees
                  ? "Loading employees..."
                  : employees.length === 0
                    ? "No active employees available"
                    : "Select employee"}
              </option>

              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>

          <label className="lm-visit-field">
            <span>Visit Date & Time</span>
            <input
              type="datetime-local"
              name="scheduledDate"
              value={form.scheduledDate}
              onChange={handleChange}
              min={new Date(Date.now() + 60000)
                .toISOString()
                .slice(0, 16)}
              required
            />
          </label>

          <label className="lm-visit-field lm-visit-field-full">
            <span>Additional Notes <small>(Optional)</small></span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add instructions or information for the assigned employee..."
              rows={3}
              maxLength={1000}
            />
          </label>
        </div>

        {error && (
          <div className="lm-visit-form-message error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="lm-visit-form-message success" role="status">
            {success}
          </div>
        )}

        <div className="lm-visit-form-footer">
          {onClose && (
            <button
              type="button"
              className="lm-visit-cancel-button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="lm-visit-submit-button"
            disabled={
              submitting ||
              loadingEmployees ||
              employees.length === 0
            }
          >
            {submitting ? "Scheduling..." : "Schedule Property Visit"}
          </button>
        </div>
      </form>
    </section>
  );
}
