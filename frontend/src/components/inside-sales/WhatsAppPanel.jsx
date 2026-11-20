
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api.js";
import "../../styles/pages/whatsapp-panel.css";

const initialForm = {
  messageType: "text",
  messageContent: "",
};

const messageTypes = [
  { value: "text", label: "Text Message" },
  { value: "property_details", label: "Property Details" },
  { value: "follow_up", label: "Follow-up" },
];

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatLabel = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

export default function WhatsAppPanel({ customer }) {
  const customerId = customer?._id || customer?.id;

  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMessages = useCallback(async () => {
    if (!customerId) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/messages/customer/${customerId}`
      );

      setMessages(response.data.messages || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load WhatsApp message history."
      );
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!form.messageContent.trim()) {
      setError("Please enter a message before continuing.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/messages", {
        customerId,
        messageType: form.messageType,
        messageContent: form.messageContent.trim(),
      });

      setForm(initialForm);
      setSuccess("Simulated WhatsApp message created successfully.");

      await fetchMessages();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create the WhatsApp message."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSimulationStatus = async (messageId, status) => {
    try {
      setUpdatingId(messageId);
      setError("");
      setSuccess("");

      await api.patch(
        `/messages/${messageId}/simulate-status`,
        { status }
      );

      setSuccess(
        `Simulation status updated to ${formatLabel(status)}.`
      );

      await fetchMessages();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update the simulated message status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="lm-whatsapp-panel">
      <div className="lm-whatsapp-header">
        <div>
          <p className="lm-whatsapp-eyebrow">
            CUSTOMER COMMUNICATION
          </p>
          <h2>WhatsApp Messages</h2>
          <p>
            Create messages and track their simulated delivery
            progress for {customer?.name || "this customer"}.
          </p>
        </div>

        <span className="lm-whatsapp-simulation-badge">
          SIMULATION MODE
        </span>
      </div>

      <div className="lm-whatsapp-simulation-notice">
        <strong>Simulation environment</strong>
        <span>
          Messages are recorded inside Luminest. Delivery and read
          statuses below are simulated; no real WhatsApp message is
          sent to the customer.
        </span>
      </div>

      {error && (
        <div className="lm-whatsapp-alert lm-whatsapp-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="lm-whatsapp-alert lm-whatsapp-alert-success">
          {success}
        </div>
      )}

      <form
        className="lm-whatsapp-composer"
        onSubmit={handleSendMessage}
      >
        <div className="lm-whatsapp-section-heading">
          <div>
            <h3>Create Message</h3>
            <p>Prepare a customer communication record.</p>
          </div>
        </div>

        <div className="lm-whatsapp-form-field">
          <label htmlFor="whatsapp-message-type">
            Message Category
          </label>

          <select
            id="whatsapp-message-type"
            name="messageType"
            value={form.messageType}
            onChange={handleFormChange}
            disabled={saving}
          >
            {messageTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="lm-whatsapp-form-field">
          <label htmlFor="whatsapp-message-content">
            Message Content
          </label>

          <textarea
            id="whatsapp-message-content"
            name="messageContent"
            rows="4"
            maxLength="4000"
            placeholder="Type your customer message..."
            value={form.messageContent}
            onChange={handleFormChange}
            disabled={saving}
          />

          <small>
            {form.messageContent.length}/4000 characters
          </small>
        </div>

        <div className="lm-whatsapp-composer-actions">
          <button
            type="submit"
            className="lm-whatsapp-primary-button"
            disabled={saving || !form.messageContent.trim()}
          >
            {saving ? "Creating..." : "Create Simulated Message"}
          </button>
        </div>
      </form>

      <div className="lm-whatsapp-history">
        <div className="lm-whatsapp-section-heading">
          <div>
            <h3>Message History</h3>
            <p>
              {messages.length} message
              {messages.length === 1 ? "" : "s"} recorded
            </p>
          </div>

          <button
            type="button"
            className="lm-whatsapp-refresh-button"
            onClick={fetchMessages}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="lm-whatsapp-empty">
            Loading message history...
          </div>
        ) : messages.length === 0 ? (
          <div className="lm-whatsapp-empty">
            <strong>No messages yet</strong>
            <span>
              Create the first message using the composer above.
            </span>
          </div>
        ) : (
          <div className="lm-whatsapp-message-list">
            {messages.map((message) => {
              const messageId = message._id || message.id;
              const status = message.deliveryStatus || "pending";
              const isSimulated =
                message.externalMessageId?.startsWith("SIMULATED_");
              const isUpdating = updatingId === messageId;

              return (
                <article
                  className="lm-whatsapp-message-card"
                  key={messageId}
                >
                  <div className="lm-whatsapp-message-top">
                    <div>
                      <span className="lm-whatsapp-message-type">
                        {formatLabel(message.messageType)}
                      </span>

                      <small>
                        {formatDate(message.sentAt || message.createdAt)}
                      </small>
                    </div>

                    <span
                      className={`lm-whatsapp-status lm-whatsapp-status-${status}`}
                    >
                      {formatLabel(status)}
                    </span>
                  </div>

                  <p className="lm-whatsapp-message-content">
                    {message.messageContent}
                  </p>

                  <div className="lm-whatsapp-message-meta">
                    <span>
                      By {message.employee?.name || "Employee"}
                    </span>

                    {isSimulated && (
                      <span className="lm-whatsapp-simulated-label">
                        SIMULATED
                      </span>
                    )}
                  </div>

                  {(message.deliveredAt || message.readAt) && (
                    <div className="lm-whatsapp-timestamps">
                      {message.deliveredAt && (
                        <span>
                          Delivered: {formatDate(message.deliveredAt)}
                        </span>
                      )}

                      {message.readAt && (
                        <span>
                          Read: {formatDate(message.readAt)}
                        </span>
                      )}
                    </div>
                  )}

                  {message.failureReason && (
                    <p className="lm-whatsapp-failure-reason">
                      {message.failureReason}
                    </p>
                  )}

                  {isSimulated && status !== "failed" && (
                    <div className="lm-whatsapp-simulation-actions">
                      {status === "sent" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleSimulationStatus(
                                messageId,
                                "delivered"
                              )
                            }
                            disabled={isUpdating}
                          >
                            {isUpdating
                              ? "Updating..."
                              : "Mark Delivered"}
                          </button>

                          <button
                            type="button"
                            className="lm-whatsapp-read-action"
                            onClick={() =>
                              handleSimulationStatus(
                                messageId,
                                "failed"
                              )
                            }
                            disabled={isUpdating}
                          >
                            Simulate Failure
                          </button>
                        </>
                      )}

                      {status === "delivered" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleSimulationStatus(messageId, "read")
                          }
                          disabled={isUpdating}
                        >
                          {isUpdating ? "Updating..." : "Mark Read"}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
