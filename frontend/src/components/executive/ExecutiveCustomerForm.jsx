import { useState } from "react";
import api from "../../services/api.js";
import CustomSelect from "../common/CustomSelect.jsx";

const emptyForm = {
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

const toFormValues = (customer) => {
  if (!customer) return { ...emptyForm };

  return {
    name: customer.name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    interestedProperty: customer.interestedProperty || "",
    budgetMin: customer.budgetMin ?? "",
    budgetMax: customer.budgetMax ?? "",
    preferredLocation: customer.preferredLocation || "",
    notes: customer.notes || "",
    status: customer.status || "new",
  };
};

export default function ExecutiveCustomerForm({ customer = null, onCancel, onSuccess }) {
  const isEditing = Boolean(customer?._id || customer?.id);
  const [form, setForm] = useState(() => toFormValues(customer));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const minBudget = form.budgetMin === "" ? undefined : Number(form.budgetMin);
    const maxBudget = form.budgetMax === "" ? undefined : Number(form.budgetMax);

    if (minBudget !== undefined && (!Number.isFinite(minBudget) || minBudget < 0)) {
      setError("Enter a valid non-negative minimum budget.");
      return;
    }

    if (maxBudget !== undefined && (!Number.isFinite(maxBudget) || maxBudget < 0)) {
      setError("Enter a valid non-negative maximum budget.");
      return;
    }

    if (minBudget !== undefined && maxBudget !== undefined && minBudget > maxBudget) {
      setError("Minimum budget cannot exceed maximum budget.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      interestedProperty: form.interestedProperty.trim(),
      preferredLocation: form.preferredLocation.trim(),
      notes: form.notes.trim(),
      status: form.status,
    };

    if (isEditing) {
      // Send null when a budget is cleared so the API removes the old value.
      payload.budgetMin = minBudget ?? null;
      payload.budgetMax = maxBudget ?? null;
    } else {
      if (minBudget !== undefined) payload.budgetMin = minBudget;
      if (maxBudget !== undefined) payload.budgetMax = maxBudget;
    }

    try {
      setSaving(true);
      if (isEditing) {
        const customerId = customer._id || customer.id;
        await api.put(`/customers/${customerId}`, payload);
      } else {
        await api.post("/customers", payload);
      }
      onSuccess?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isEditing
            ? "Unable to update customer. Please try again."
            : "Unable to create customer. Please try again.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="lm-executive-form-overlay">
      <section
        className="lm-executive-customer-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="executive-customer-form-title"
      >
        <header className="lm-executive-form-header">
          <div>
            <span>{isEditing ? "UPDATE CUSTOMER RECORD" : "NEW CUSTOMER RECORD"}</span>
            <h2 id="executive-customer-form-title">
              {isEditing ? "Edit Customer" : "Create Customer"}
            </h2>
            <p>
              {isEditing
                ? "Update the customer's information and sales status."
                : "Add a new customer to the Luminest CRM."}
            </p>
          </div>

          <button
            type="button"
            className="lm-executive-form-close"
            onClick={onCancel}
            disabled={saving}
            aria-label="Close form"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="lm-executive-form-body">
            {error && <div className="lm-executive-form-error" role="alert">{error}</div>}

            <div className="lm-executive-form-section-title">Customer Information</div>

            <div className="lm-executive-form-grid">
              <label>
                Customer Name *
                <input name="name" value={form.name} onChange={handleChange} placeholder="Enter full name" required />
              </label>

              <label>
                Phone Number *
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Enter phone number" required />
              </label>

              <label>
                Email Address
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter email address" />
              </label>

              <label>
                Interested Property
                <input name="interestedProperty" value={form.interestedProperty} onChange={handleChange} placeholder="e.g. 3 BHK Apartment" />
              </label>

              <label>
                Minimum Budget (₹)
                <input type="number" min="0" name="budgetMin" value={form.budgetMin} onChange={handleChange} placeholder="Minimum budget" />
              </label>

              <label>
                Maximum Budget (₹)
                <input type="number" min="0" name="budgetMax" value={form.budgetMax} onChange={handleChange} placeholder="Maximum budget" />
              </label>

              <label>
                Preferred Location
                <input name="preferredLocation" value={form.preferredLocation} onChange={handleChange} placeholder="e.g. Mogappair, Chennai" />
              </label>

              <label>
                Sales Status
                <CustomSelect
                  value={form.status}
                  options={statusOptions}
                  onChange={(value) => setForm((previous) => ({ ...previous, status: value }))}
                  placeholder="Select sales status"
                />
              </label>
            </div>

            <label className="lm-executive-form-notes">
              Additional Notes
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows="4"
                placeholder="Enter customer requirements or additional information..."
              />
            </label>
          </div>

          <footer className="lm-executive-form-footer">
            <button type="button" className="lm-executive-form-cancel" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="lm-executive-form-submit" disabled={saving}>
              {saving ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create Customer")}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
