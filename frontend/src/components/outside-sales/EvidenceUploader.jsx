
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api.js";
import "../../styles/pages/evidence-uploader.css";

const EVIDENCE_TYPES = [
  { value: "property_photo", label: "Property Photo" },
  { value: "customer_photo", label: "Customer Photo" },
  { value: "document", label: "Document" },
  { value: "other", label: "Other" },
];

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function EvidenceUploader({ visit, onUploaded }) {
  const [file, setFile] = useState(null);
  const [evidenceType, setEvidenceType] = useState("property_photo");
  const [description, setDescription] = useState("");
  const [capturedAt, setCapturedAt] = useState("");
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [evidence, setEvidence] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchEvidence = useCallback(async () => {
    if (!visit?._id) return;

    try {
      setHistoryLoading(true);
      setHistoryError("");

      const response = await api.get(
        `/visit-evidence/${visit._id}`
      );

      setEvidence(response.data.evidence || []);
    } catch (err) {
      setHistoryError(
        err.response?.data?.message ||
          "Unable to load visit evidence."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [visit?._id]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  useEffect(() => {
    return () => {
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    };
  }, [file]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setError("");
    setSuccess("");
    setGps(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Only JPG, PNG, WEBP and PDF files are allowed.");
      event.target.value = "";
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must not exceed 5 MB.");
      event.target.value = "";
      setFile(null);
      return;
    }

    const previewUrl = selectedFile.type.startsWith("image/")
      ? URL.createObjectURL(selectedFile)
      : null;

    setFile({
      originalFile: selectedFile,
      previewUrl,
    });
  };

  const captureGps = () => {
    setError("");
    setSuccess("");

    if (!navigator.geolocation) {
      setError("GPS location is not supported by this browser.");
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setGpsLoading(false);
      },
      (geoError) => {
        const messages = {
          1: "Location permission was denied.",
          2: "Your current location could not be determined.",
          3: "GPS request timed out. Please try again.",
        };

        setError(
          messages[geoError.code] ||
            "Unable to capture your GPS location."
        );

        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!visit?._id) {
      setError("A valid visit is required to upload evidence.");
      return;
    }

    if (!file?.originalFile) {
      setError("Please select a file to upload.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("file", file.originalFile);
      formData.append("visitId", visit._id);
      formData.append("evidenceType", evidenceType);
      formData.append("description", description.trim());

      if (capturedAt) {
        formData.append(
          "capturedAt",
          new Date(capturedAt).toISOString()
        );
      }

      if (gps) {
        formData.append("latitude", String(gps.latitude));
        formData.append("longitude", String(gps.longitude));
      }

      const response = await api.post(
        "/visit-evidence",
        formData
      );

      setSuccess(
        response.data.message ||
          "Evidence uploaded successfully."
      );

      setFile(null);
      setEvidenceType("property_photo");
      setDescription("");
      setCapturedAt("");
      setGps(null);

      const fileInput = document.getElementById(
        "lm-evidence-file-input"
      );

      if (fileInput) fileInput.value = "";

      await fetchEvidence();
      onUploaded?.(response.data.evidence);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to upload evidence. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const visitStatus = visit?.status;

  if (!["in_progress", "completed"].includes(visitStatus)) {
    return (
      <section className="lm-evidence-uploader">
        <h3>Visit Evidence</h3>
        <p>
          Evidence can be uploaded after arrival has been confirmed.
        </p>
      </section>
    );
  }

  return (
    <section className="lm-evidence-uploader">
      <div className="lm-evidence-uploader-heading">
        <div>
          <span>LUMINEST · FIELD EVIDENCE</span>
          <h3>Upload Visit Evidence</h3>
          <p>
            Attach property photos, documents and supporting evidence
            to this visit.
          </p>
        </div>

        <div className="lm-evidence-uploader-mark">UP</div>
      </div>

      {error && (
        <div className="lm-evidence-alert error">{error}</div>
      )}

      {success && (
        <div className="lm-evidence-alert success">{success}</div>
      )}

      <form onSubmit={handleUpload}>
        <div className="lm-evidence-field">
          <label htmlFor="lm-evidence-file-input">
            Select File
          </label>

          <input
            id="lm-evidence-file-input"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleFileChange}
          />

          <small>JPG, PNG, WEBP or PDF · Maximum 5 MB</small>
        </div>

        {file && (
          <div className="lm-evidence-preview">
            {file.previewUrl ? (
              <img
                src={file.previewUrl}
                alt="Selected evidence preview"
              />
            ) : (
              <div className="lm-evidence-file-icon">PDF</div>
            )}

            <div>
              <strong>{file.originalFile.name}</strong>
              <span>
                {(file.originalFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
        )}

        <div className="lm-evidence-field">
          <label htmlFor="lm-evidence-type">
            Evidence Category
          </label>

          <select
            id="lm-evidence-type"
            value={evidenceType}
            onChange={(event) =>
              setEvidenceType(event.target.value)
            }
          >
            {EVIDENCE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="lm-evidence-field">
          <label htmlFor="lm-evidence-description">
            Description
          </label>

          <textarea
            id="lm-evidence-description"
            rows="3"
            maxLength={500}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Describe the property photo or supporting document..."
          />
        </div>

        <div className="lm-evidence-field">
          <label htmlFor="lm-evidence-captured-at">
            Capture Date and Time (Optional)
          </label>

          <input
            id="lm-evidence-captured-at"
            type="datetime-local"
            value={capturedAt}
            onChange={(event) =>
              setCapturedAt(event.target.value)
            }
          />
        </div>

        <div className="lm-evidence-gps">
          <div>
            <strong>Attach Current GPS Location</strong>
            <p>
              Capture your current coordinates and attach them
              to this evidence record.
            </p>

            {gps && (
              <small>
                {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
              </small>
            )}
          </div>

          <button
            type="button"
            onClick={captureGps}
            disabled={gpsLoading || uploading}
          >
            {gpsLoading
              ? "Capturing..."
              : gps
                ? "Refresh GPS"
                : "Capture GPS"}
          </button>
        </div>

        <button
          type="submit"
          className="lm-evidence-upload-button"
          disabled={uploading || !file}
        >
          {uploading ? "Uploading to Cloudinary..." : "Upload Evidence"}
        </button>
      </form>

      <div className="lm-evidence-history">
        <div className="lm-evidence-history-heading">
          <div>
            <h4>Uploaded Evidence</h4>
            <p>Files already attached to this property visit.</p>
          </div>

          <button
            type="button"
            onClick={fetchEvidence}
            disabled={historyLoading}
          >
            {historyLoading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {historyLoading ? (
          <p className="lm-evidence-history-state">
            Loading uploaded evidence...
          </p>
        ) : historyError ? (
          <div className="lm-evidence-alert error">
            {historyError}
          </div>
        ) : evidence.length === 0 ? (
          <p className="lm-evidence-history-state">
            No evidence has been uploaded for this visit yet.
          </p>
        ) : (
          <div className="lm-evidence-history-grid">
            {evidence.map((item) => (
              <article
                className="lm-evidence-history-card"
                key={item._id}
              >
                {item.mimeType?.startsWith("image/") ? (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={item.fileUrl}
                      alt={item.description || item.fileName}
                    />
                  </a>
                ) : (
                  <div className="lm-evidence-history-document">
                    PDF
                  </div>
                )}

                <div className="lm-evidence-history-info">
                  <strong>{item.fileName}</strong>
                  <span>
                    {EVIDENCE_TYPES.find(
                      (type) => type.value === item.evidenceType
                    )?.label || item.evidenceType}
                  </span>

                  {item.description && (
                    <p>{item.description}</p>
                  )}

                  <small>{formatDate(item.createdAt)}</small>

                  {item.latitude != null &&
                    item.longitude != null && (
                      <small>
                        GPS: {item.latitude}, {item.longitude}
                      </small>
                    )}
                </div>

                <a
                  className="lm-evidence-history-open"
                  href={item.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View File ↗
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
