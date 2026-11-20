
import { useCallback, useEffect, useMemo, useState } from "react";
import messageService from "../../services/messageService.js";
import "../../styles/pages/whatsapp-messages.css";

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

const WhatsAppMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await messageService.getMyMessages();

      setMessages(response.messages || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load WhatsApp messages."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const stats = useMemo(() => ({
    total: messages.length,
    sent: messages.filter((item) => item.deliveryStatus === "sent").length,
    delivered: messages.filter(
      (item) => item.deliveryStatus === "delivered"
    ).length,
    read: messages.filter((item) => item.deliveryStatus === "read").length,
    failed: messages.filter((item) => item.deliveryStatus === "failed").length,
  }), [messages]);

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();

    return messages.filter((message) => {
      const customer = message.customer || {};

      const matchesSearch =
        !query ||
        customer.name?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        message.messageContent?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        message.deliveryStatus === statusFilter;

      const matchesType =
        typeFilter === "all" ||
        message.messageType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [messages, search, statusFilter, typeFilter]);

  const handleSimulationStatus = async (messageId, status) => {
    try {
      setUpdatingId(messageId);
      setError("");
      setSuccess("");

      await messageService.simulateMessageStatus(messageId, status);

      setSuccess(`Message status updated to ${formatLabel(status)}.`);

      await fetchMessages();

      setSelectedMessage((current) =>
        current?._id === messageId ? null : current
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update simulated message status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const getMessageStatus = (message) =>
    message.deliveryStatus || "pending";

  const isSimulated = (message) =>
    message.externalMessageId?.startsWith("SIMULATED_");

  return (
    <main className="lm-wa-messages">
      <header className="lm-wa-messages-header">
        <div>
          <span className="lm-wa-messages-eyebrow">
            LUMINEST · CUSTOMER COMMUNICATION
          </span>

          <h1>WhatsApp Messages</h1>

          <p>
            View and track WhatsApp communication records across
            your assigned customers.
          </p>
        </div>

        <span className="lm-wa-mode-badge">
          SIMULATION MODE
        </span>
      </header>

      <section className="lm-wa-notice">
        <strong>Simulation environment</strong>
        <p>
          Messages are recorded inside Luminest. Delivery and read
          statuses are simulated. No real WhatsApp messages are sent.
        </p>
      </section>

      {error && (
        <div className="lm-wa-alert error">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="lm-wa-alert success">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess("")}>
            Dismiss
          </button>
        </div>
      )}

      <section className="lm-wa-stats">
        <article className="lm-wa-stat">
          <span>Total Messages</span>
          <strong>{stats.total}</strong>
        </article>

        <article className="lm-wa-stat">
          <span>Sent</span>
          <strong>{stats.sent}</strong>
        </article>

        <article className="lm-wa-stat">
          <span>Delivered</span>
          <strong>{stats.delivered}</strong>
        </article>

        <article className="lm-wa-stat">
          <span>Read</span>
          <strong>{stats.read}</strong>
        </article>

        <article className="lm-wa-stat failed">
          <span>Failed</span>
          <strong>{stats.failed}</strong>
        </article>
      </section>

      <section className="lm-wa-content">
        <div className="lm-wa-toolbar">
          <div>
            <h2>Message History</h2>
            <p>
              {filteredMessages.length} of {messages.length} messages
            </p>
          </div>

          <button
            type="button"
            className="lm-wa-refresh"
            onClick={fetchMessages}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        <div className="lm-wa-filters">
          <input
            type="search"
            placeholder="Search customer, phone or message..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="read">Read</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="text">Text Message</option>
            <option value="property_details">Property Details</option>
            <option value="follow_up">Follow-up</option>
          </select>
        </div>

        {loading ? (
          <div className="lm-wa-state">
            Loading WhatsApp messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="lm-wa-empty">
            <span>✉</span>
            <h3>No messages found</h3>
            <p>
              {messages.length === 0
                ? "Your WhatsApp message history will appear here."
                : "Try changing your search or filters."}
            </p>
          </div>
        ) : (
          <div className="lm-wa-table-wrap">
            <table className="lm-wa-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Message</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {filteredMessages.map((message) => {
                  const messageId = message._id || message.id;
                  const status = getMessageStatus(message);

                  return (
                    <tr key={messageId}>
                      <td>
                        <div className="lm-wa-customer">
                          <strong>
                            {message.customer?.name || "Unknown Customer"}
                          </strong>
                          <span>
                            {message.customer?.phone || "No phone"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="lm-wa-message-preview">
                          {message.messageContent}
                        </div>
                      </td>

                      <td>
                        <span className="lm-wa-type">
                          {formatLabel(message.messageType || "text")}
                        </span>
                      </td>

                      <td className="lm-wa-date">
                        {formatDate(message.sentAt || message.createdAt)}
                      </td>

                      <td>
                        <span className={`lm-wa-status ${status}`}>
                          {formatLabel(status)}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="lm-wa-view"
                          onClick={() => setSelectedMessage(message)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedMessage && (
        <div
          className="lm-wa-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedMessage(null);
            }
          }}
        >
          <section
            className="lm-wa-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lm-wa-modal-title"
          >
            <div className="lm-wa-modal-header">
              <div>
                <span>MESSAGE INFORMATION</span>
                <h2 id="lm-wa-modal-title">Message Details</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            <div className="lm-wa-modal-body">
              <div className="lm-wa-detail-grid">
                <div>
                  <span>Customer</span>
                  <strong>
                    {selectedMessage.customer?.name || "Unknown Customer"}
                  </strong>
                </div>

                <div>
                  <span>Phone</span>
                  <strong>
                    {selectedMessage.customer?.phone || "—"}
                  </strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>
                    {selectedMessage.customer?.email || "—"}
                  </strong>
                </div>

                <div>
                  <span>Category</span>
                  <strong>
                    {formatLabel(selectedMessage.messageType || "text")}
                  </strong>
                </div>

                <div>
                  <span>Delivery Status</span>
                  <strong>
                    {formatLabel(getMessageStatus(selectedMessage))}
                  </strong>
                </div>

                <div>
                  <span>Created Date</span>
                  <strong>
                    {formatDate(selectedMessage.createdAt)}
                  </strong>
                </div>

                <div>
                  <span>Sent Date</span>
                  <strong>
                    {formatDate(selectedMessage.sentAt)}
                  </strong>
                </div>

                <div>
                  <span>Delivered Date</span>
                  <strong>
                    {formatDate(selectedMessage.deliveredAt)}
                  </strong>
                </div>

                <div>
                  <span>Read Date</span>
                  <strong>
                    {formatDate(selectedMessage.readAt)}
                  </strong>
                </div>

                <div>
                  <span>Created By</span>
                  <strong>
                    {selectedMessage.employee?.name || "Employee"}
                  </strong>
                </div>
              </div>

              <div className="lm-wa-detail-message">
                <span>Message Content</span>
                <p>{selectedMessage.messageContent}</p>
              </div>

              {selectedMessage.failureReason && (
                <div className="lm-wa-failure">
                  Failure reason: {selectedMessage.failureReason}
                </div>
              )}

              {isSimulated(selectedMessage) && (
                <span className="lm-wa-simulated">
                  SIMULATED MESSAGE
                </span>
              )}

              {isSimulated(selectedMessage) &&
                getMessageStatus(selectedMessage) !== "failed" && (
                  <div className="lm-wa-modal-actions">
                    {getMessageStatus(selectedMessage) === "sent" && (
                      <>
                        <button
                          type="button"
                          disabled={updatingId === selectedMessage._id}
                          onClick={() =>
                            handleSimulationStatus(
                              selectedMessage._id,
                              "delivered"
                            )
                          }
                        >
                          Mark Delivered
                        </button>

                        <button
                          type="button"
                          className="danger"
                          disabled={updatingId === selectedMessage._id}
                          onClick={() =>
                            handleSimulationStatus(
                              selectedMessage._id,
                              "failed"
                            )
                          }
                        >
                          Simulate Failure
                        </button>
                      </>
                    )}

                    {getMessageStatus(selectedMessage) === "delivered" && (
                      <button
                        type="button"
                        disabled={updatingId === selectedMessage._id}
                        onClick={() =>
                          handleSimulationStatus(
                            selectedMessage._id,
                            "read"
                          )
                        }
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default WhatsAppMessages;
