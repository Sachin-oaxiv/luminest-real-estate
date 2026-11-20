
import { useCallback, useEffect, useMemo, useState } from "react";
import mediaService from "../../services/mediaService.js";
import CustomSelect from "../../components/common/CustomSelect.jsx";
import "../../styles/pages/media.css";

const initialFilters = {
  search: "",
  evidenceType: "all",
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 12,
};


const evidenceOptions = [
  { value: "all", label: "All Evidence Types" },
  { value: "property_photo", label: "Property Photo" },
  { value: "customer_photo", label: "Customer Photo" },
  { value: "document", label: "Document" },
  { value: "other", label: "Other" },
  { value: "audio_recording", label: "Audio Recording" },
];


const formatLabel = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatFileSize = (bytes = 0) => {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function Media() {
  const [media, setMedia] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });

  const [filters, setFilters] = useState(initialFilters);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await mediaService.getAllMedia(filters);

      setMedia(response.media || []);
      setPagination(
        response.pagination || {
          total: 0,
          page: 1,
          limit: 12,
          totalPages: 0,
        }
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load media library."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const updateFilter = (name, value) => {
    setFilters((previous) => ({
      ...previous,
      [name]: value,
      page: 1,
    }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const imageCount = useMemo(
    () =>
      media.filter((item) =>
        item.mimeType?.startsWith("image/")
      ).length,
    [media]
  );

  const documentCount = useMemo(
    () =>
      media.filter((item) =>
        item.mimeType?.startsWith("application/")
      ).length,
    [media]
  );

  const goToPage = (page) => {
    if (
      page < 1 ||
      page > pagination.totalPages ||
      page === filters.page
    ) {
      return;
    }

    setFilters((previous) => ({
      ...previous,
      page,
    }));
  };

  return (
    <main className="admin-page lm-media-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">
            MEDIA & EVIDENCE MANAGEMENT
          </p>
          <h1>Media Library</h1>
          <p>
            Browse and manage photos and documents uploaded during
            property visits.
          </p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={fetchMedia}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </header>

      {error && (
        <div className="admin-alert admin-alert-error">
          {error}
          <button type="button" onClick={fetchMedia}>
            Retry
          </button>
        </div>
      )}

      <section className="lm-media-stats">
        <article className="lm-media-stat">
          <div className="lm-media-stat-icon blue">▧</div>
          <div>
            <span>Total Media</span>
            <strong>{pagination.total}</strong>
            <small>All matching records</small>
          </div>
        </article>

        <article className="lm-media-stat">
          <div className="lm-media-stat-icon green">▣</div>
          <div>
            <span>Images on This Page</span>
            <strong>{imageCount}</strong>
            <small>Current page</small>
          </div>
        </article>

        <article className="lm-media-stat">
          <div className="lm-media-stat-icon purple">▤</div>
          <div>
            <span>Documents on This Page</span>
            <strong>{documentCount}</strong>
            <small>Current page</small>
          </div>
        </article>

        <article className="lm-media-stat">
          <div className="lm-media-stat-icon orange">▦</div>
          <div>
            <span>Total Pages</span>
            <strong>{pagination.totalPages}</strong>
            <small>12 records per page</small>
          </div>
        </article>
      </section>

      <section className="lm-media-library">
        <div className="lm-media-toolbar">
          <div className="lm-media-toolbar-heading">
            <h2>All Media</h2>
            <p>
              View uploaded visit evidence and related information.
            </p>
          </div>

          <div className="lm-media-filters">
            <input
              type="search"
              placeholder="Search filename or description..."
              value={filters.search}
              onChange={(event) =>
                updateFilter("search", event.target.value)
              }
            />

            <CustomSelect
              value={filters.evidenceType}
              options={evidenceOptions}
              onChange={(value) =>
                updateFilter("evidenceType", value)
              }
              placeholder="Select evidence type"
              className="lm-media-evidence-select"
            />

            <input
              type="date"
              aria-label="From date"
              value={filters.dateFrom}
              onChange={(event) =>
                updateFilter("dateFrom", event.target.value)
              }
            />

            <input
              type="date"
              aria-label="To date"
              min={filters.dateFrom || undefined}
              value={filters.dateTo}
              onChange={(event) =>
                updateFilter("dateTo", event.target.value)
              }
            />

            <button
              type="button"
              className="admin-secondary-button"
              onClick={resetFilters}
            >
              Clear
            </button>
          </div>
        </div>

        {loading && (
          <div className="lm-media-loading">
            <div className="admin-loading-spinner" />
            <p>Loading media library...</p>
          </div>
        )}

        {!loading && !error && media.length > 0 && (
          <>
            <div className="lm-media-gallery">
              {media.map((item) => {
                const isImage = item.mimeType?.startsWith("image/");

                return (
                  <article
                    className="lm-media-card"
                    key={item._id}
                  >
                    <button
                      type="button"
                      className="lm-media-preview"
                      onClick={() => setSelectedMedia(item)}
                      aria-label={`View ${item.fileName}`}
                    >
                      {isImage ? (
                        <img
                          src={item.fileUrl}
                          alt={item.description || item.fileName}
                          loading="lazy"
                        />
                      ) : (
                        <div className="lm-media-file-placeholder">
                          <span>▤</span>
                          <strong>
                            {item.mimeType?.split("/")[1] || "FILE"}
                          </strong>
                        </div>
                      )}

                      <span className="lm-media-view-overlay">
                        View Details
                      </span>
                    </button>

                    <div className="lm-media-card-content">
                      <div className="lm-media-card-top">
                        <span className="lm-media-type">
                          {formatLabel(item.evidenceType)}
                        </span>
                        <span className="lm-media-size">
                          {formatFileSize(item.fileSize)}
                        </span>
                      </div>

                      <h3 title={item.fileName}>
                        {item.fileName || "Untitled file"}
                      </h3>

                      <p className="lm-media-description">
                        {item.description || "No description provided"}
                      </p>

                      <div className="lm-media-card-meta">
                        <span>
                          Uploaded by
                          <strong>
                            {item.uploadedBy?.name || "Unknown"}
                          </strong>
                        </span>

                        <span>{formatDate(item.createdAt)}</span>
                      </div>

                      <button
                        type="button"
                        className="lm-media-details-button"
                        onClick={() => setSelectedMedia(item)}
                      >
                        View Details →
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="lm-media-pagination">
              <p>
                Showing{" "}
                <strong>
                  {(pagination.page - 1) * pagination.limit + 1}
                </strong>
                {" "}to{" "}
                <strong>
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </strong>
                {" "}of{" "}
                <strong>{pagination.total}</strong> records
              </p>

              <div className="lm-media-page-actions">
                <button
                  type="button"
                  onClick={() => goToPage(filters.page - 1)}
                  disabled={filters.page <= 1 || loading}
                >
                  ← Previous
                </button>

                <span>
                  Page {pagination.page} of{" "}
                  {pagination.totalPages || 1}
                </span>

                <button
                  type="button"
                  onClick={() => goToPage(filters.page + 1)}
                  disabled={
                    filters.page >= pagination.totalPages || loading
                  }
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}

        {!loading && !error && media.length === 0 && (
          <div className="lm-media-empty">
            <div>▧</div>
            <h3>No media found</h3>
            <p>
              There are no media records matching your current filters.
            </p>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={resetFilters}
            >
              Clear Filters
            </button>
          </div>
        )}
      </section>

      {selectedMedia && (
        <div
          className="lm-media-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedMedia(null);
            }
          }}
        >
          <section
            className="lm-media-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lm-media-modal-title"
          >
            <header className="lm-media-modal-header">
              <div>
                <p className="admin-eyebrow">
                  MEDIA INFORMATION
                </p>
                <h2 id="lm-media-modal-title">Media Details</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </header>

            <div className="lm-media-modal-body">
              {selectedMedia.mimeType?.startsWith("image/") ? (
                <div className="lm-media-modal-image">
                  <img
                    src={selectedMedia.fileUrl}
                    alt={
                      selectedMedia.description ||
                      selectedMedia.fileName
                    }
                  />
                </div>
              ) : selectedMedia.evidenceType === "audio_recording" ? (
                <div className="lm-media-audio-player">
                  <p>Visit audio recording</p>
                  <audio controls preload="metadata" src={selectedMedia.fileUrl}>
                    Your browser does not support audio playback.
                  </audio>
                </div>
              ) : (
                <div className="lm-media-file-placeholder">
                  <span>▤</span>
                  <strong>
                    {selectedMedia.mimeType?.split("/")[1] || "FILE"}
                  </strong>
                </div>
              )}

              <div className="lm-media-detail-grid">
                <div>
                  <span>File Name</span>
                  <strong>{selectedMedia.fileName || "—"}</strong>
                </div>

                <div>
                  <span>Evidence Type</span>
                  <strong>
                    {formatLabel(selectedMedia.evidenceType)}
                  </strong>
                </div>

                <div>
                  <span>File Size</span>
                  <strong>{formatFileSize(selectedMedia.fileSize)}</strong>
                </div>

                <div>
                  <span>File Format</span>
                  <strong>{selectedMedia.mimeType || "—"}</strong>
                </div>

                <div>
                  <span>Uploaded By</span>
                  <strong>
                    {selectedMedia.uploadedBy?.name || "Unknown"}
                  </strong>
                </div>

                <div>
                  <span>Uploader Role</span>
                  <strong>
                    {formatLabel(selectedMedia.uploadedBy?.role || "") || "—"}
                  </strong>
                </div>

                <div>
                  <span>Upload Date</span>
                  <strong>{formatDate(selectedMedia.createdAt)}</strong>
                </div>

                <div>
                  <span>Captured Date</span>
                  <strong>{formatDate(selectedMedia.capturedAt)}</strong>
                </div>

                <div>
                  <span>Customer</span>
                  <strong>
                    {selectedMedia.visit?.customer?.name || "—"}
                  </strong>
                </div>

                <div>
                  <span>Assigned Employee</span>
                  <strong>
                    {selectedMedia.visit?.assignedTo?.name || "—"}
                  </strong>
                </div>

                <div>
                  <span>Property</span>
                  <strong>
                    {selectedMedia.visit?.propertyName || "—"}
                  </strong>
                </div>

                <div>
                  <span>Property Address</span>
                  <strong>
                    {selectedMedia.visit?.propertyAddress || "—"}
                  </strong>
                </div>

                <div>
                  <span>Visit Status</span>
                  <strong>
                    {formatLabel(selectedMedia.visit?.status || "") || "—"}
                  </strong>
                </div>

                <div>
                  <span>GPS Coordinates</span>
                  <strong>
                    {selectedMedia.latitude != null &&
                    selectedMedia.longitude != null
                      ? `${selectedMedia.latitude}, ${selectedMedia.longitude}`
                      : "Not available"}
                  </strong>
                </div>

                <div className="lm-media-detail-full">
                  <span>Description</span>
                  <strong>
                    {selectedMedia.description || "No description provided"}
                  </strong>
                </div>
              </div>
            </div>

            <footer className="lm-media-modal-footer">
              {selectedMedia.fileUrl && (
                <a
                  href={selectedMedia.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-primary-button"
                >
                  Open Original File ↗
                </a>
              )}

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setSelectedMedia(null)}
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
