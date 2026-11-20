
import { useCallback, useEffect, useMemo, useState } from "react";
import visitEvidenceService from "../../services/visitEvidenceService.js";
import "../../styles/pages/visit-evidence.css";

const formatDate = (value) => {
  if (!value) return "Not available";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFileSize = (bytes) => {
  if (!bytes) return "Unknown size";
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const evidenceLabels = {
  property_photo: "Property Photo",
  document: "Document",
  customer_signature: "Customer Signature",
  other: "Other",
};

const VisitEvidence = () => {
  const [evidence, setEvidence] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvidence = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await visitEvidenceService.getMyVisitEvidence();
      setEvidence(result.evidence || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load visit evidence."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const filteredEvidence = useMemo(() => {
    const query = search.trim().toLowerCase();

    return evidence.filter((item) => {
      const customer = item.visit?.customer;
      const visit = item.visit;

      const matchesSearch =
        !query ||
        [
          customer?.name,
          customer?.phone,
          visit?.propertyName,
          visit?.propertyAddress,
          item.fileName,
          item.description,
        ].some((value) => value?.toLowerCase().includes(query));

      const matchesType =
        typeFilter === "all" || item.evidenceType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [evidence, search, typeFilter]);

  const propertyPhotos = evidence.filter(
    (item) => item.evidenceType === "property_photo"
  ).length;

  const documents = evidence.filter(
    (item) =>
      item.resourceType === "raw" ||
      item.evidenceType === "document"
  ).length;

  return (
    <div className="lm-visit-evidence-page">
      <div className="lm-visit-evidence-header">
        <div>
          <span className="lm-visit-evidence-eyebrow">
            OUTSIDE SALES / EVIDENCE
          </span>
          <h1>Visit Evidence</h1>
          <p>
            View and manage the photos and documents collected during
            your property visits.
          </p>
        </div>

        <button
          type="button"
          className="lm-evidence-refresh-button"
          onClick={fetchEvidence}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="lm-evidence-stats">
        <div className="lm-evidence-stat-card">
          <span>Total Evidence</span>
          <strong>{evidence.length}</strong>
          <small>All uploaded files</small>
        </div>

        <div className="lm-evidence-stat-card">
          <span>Property Photos</span>
          <strong>{propertyPhotos}</strong>
          <small>Property images</small>
        </div>

        <div className="lm-evidence-stat-card">
          <span>Documents</span>
          <strong>{documents}</strong>
          <small>Uploaded documents</small>
        </div>
      </div>

      <div className="lm-evidence-toolbar">
        <div className="lm-evidence-search">
          <input
            type="search"
            placeholder="Search customer, property, filename..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">All Evidence Types</option>
          <option value="property_photo">Property Photos</option>
          <option value="document">Documents</option>
          <option value="customer_signature">Customer Signatures</option>
          <option value="other">Other</option>
        </select>
      </div>

      {error && (
        <div className="lm-evidence-error">
          {error}
          <button type="button" onClick={fetchEvidence}>
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="lm-evidence-state">
          Loading your visit evidence...
        </div>
      ) : !error && filteredEvidence.length === 0 ? (
        <div className="lm-evidence-state">
          <h3>No evidence found</h3>
          <p>
            {evidence.length === 0
              ? "Your uploaded visit evidence will appear here."
              : "Try changing your search or evidence filter."}
          </p>
        </div>
      ) : (
        <div className="lm-evidence-grid">
          {filteredEvidence.map((item) => {
            const isImage = item.resourceType === "image" || item.mimeType?.startsWith("image/");
            const customer = item.visit?.customer;

            return (
              <article className="lm-evidence-card" key={item._id}>
                <div className="lm-evidence-preview">
                  {isImage ? (
                    <img
                      src={item.fileUrl}
                      alt={item.description || item.fileName}
                      loading="lazy"
                    />
                  ) : (
                    <div className="lm-evidence-file-placeholder">
                      <span>PDF / FILE</span>
                    </div>
                  )}

                  <span className="lm-evidence-type-badge">
                    {evidenceLabels[item.evidenceType] ||
                      item.evidenceType}
                  </span>
                </div>

                <div className="lm-evidence-card-content">
                  <h3>{item.visit?.propertyName || "Property Visit"}</h3>

                  <p className="lm-evidence-customer">
                    Customer: {customer?.name || "Not available"}
                  </p>

                  <p className="lm-evidence-address">
                    {item.visit?.propertyAddress || "Address unavailable"}
                  </p>

                  <p className="lm-evidence-description">
                    {item.description || "No description provided"}
                  </p>

                  <div className="lm-evidence-card-meta">
                    <span>{formatDate(item.createdAt)}</span>
                    <span>{formatFileSize(item.fileSize)}</span>
                  </div>

                  <button
                    type="button"
                    className="lm-evidence-view-button"
                    onClick={() => setSelectedEvidence(item)}
                  >
                    View Details
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedEvidence && (
        <div
          className="lm-evidence-modal-overlay"
          onClick={() => setSelectedEvidence(null)}
        >
          <div
            className="lm-evidence-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="lm-evidence-modal-header">
              <div>
                <span>VISIT EVIDENCE DETAILS</span>
                <h2>{selectedEvidence.visit?.propertyName || "Evidence"}</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvidence(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            <div className="lm-evidence-modal-body">
              {selectedEvidence.resourceType === "image" || selectedEvidence.mimeType?.startsWith("image/") ? (
                <img
                  className="lm-evidence-modal-image"
                  src={selectedEvidence.fileUrl}
                  alt={selectedEvidence.fileName}
                />
              ) : (
                <a
                  href={selectedEvidence.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open uploaded file
                </a>
              )}

              <div className="lm-evidence-detail-grid">
                <div>
                  <span>Customer</span>
                  <strong>
                    {selectedEvidence.visit?.customer?.name || "—"}
                  </strong>
                </div>

                <div>
                  <span>Phone</span>
                  <strong>
                    {selectedEvidence.visit?.customer?.phone || "—"}
                  </strong>
                </div>

                <div>
                  <span>Property</span>
                  <strong>
                    {selectedEvidence.visit?.propertyName || "—"}
                  </strong>
                </div>

                <div>
                  <span>Visit Status</span>
                  <strong>
                    {selectedEvidence.visit?.status || "—"}
                  </strong>
                </div>

                <div>
                  <span>Evidence Type</span>
                  <strong>
                    {evidenceLabels[selectedEvidence.evidenceType] ||
                      selectedEvidence.evidenceType}
                  </strong>
                </div>

                <div>
                  <span>File Name</span>
                  <strong>{selectedEvidence.fileName}</strong>
                </div>

                <div>
                  <span>File Size</span>
                  <strong>{formatFileSize(selectedEvidence.fileSize)}</strong>
                </div>

                <div>
                  <span>Uploaded On</span>
                  <strong>{formatDate(selectedEvidence.createdAt)}</strong>
                </div>

                <div>
                  <span>Captured On</span>
                  <strong>{formatDate(selectedEvidence.capturedAt)}</strong>
                </div>

                <div>
                  <span>GPS Latitude</span>
                  <strong>{selectedEvidence.latitude ?? "Not recorded"}</strong>
                </div>

                <div>
                  <span>GPS Longitude</span>
                  <strong>{selectedEvidence.longitude ?? "Not recorded"}</strong>
                </div>
              </div>

              <div className="lm-evidence-detail-description">
                <span>Description</span>
                <p>
                  {selectedEvidence.description || "No description provided"}
                </p>
              </div>

              {selectedEvidence.latitude != null &&
                selectedEvidence.longitude != null && (
                  <a
                    className="lm-evidence-map-link"
                    href={`https://www.google.com/maps?q=${selectedEvidence.latitude},${selectedEvidence.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View GPS Location on Google Maps
                  </a>
                )}
            </div>

            <div className="lm-evidence-modal-footer">
              <a
                href={selectedEvidence.fileUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open Original File ↗
              </a>

              <button
                type="button"
                onClick={() => setSelectedEvidence(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitEvidence;
