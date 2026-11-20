
import { useEffect, useRef, useState } from "react";
import api from "../../services/api.js";
import EvidenceUploader from "./EvidenceUploader.jsx";
import CustomerPhoneActions from "../shared/CustomerPhoneActions.jsx";
import "../../styles/pages/outside-sales-visit-details.css";

const OUTCOMES = [
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "follow_up_required", label: "Follow-up Required" },
  { value: "negotiation", label: "Negotiation" },
];

const formatDate = (value) => {
  if (!value) return "Not recorded";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatus = (value) => {
  if (!value) return "Unknown";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default function CustomerVisitDetails({
  visit,
  onClose,
  onUpdated,
}) {
  const [loadingArrival, setLoadingArrival] = useState(false);
  const [loadingCompletion, setLoadingCompletion] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [visitOutcome, setVisitOutcome] = useState("");
  const [visitFeedback, setVisitFeedback] = useState("");
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioSaving, setAudioSaving] = useState(false);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (!isRecording) return undefined;
    const timer = window.setInterval(() => {
      setRecordingSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  useEffect(() => () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      throw new Error("This browser does not support microphone recording. Please use an up-to-date Chrome or Edge browser.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];

    const preferredType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

    const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const type = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      if (blob.size) setAudioBlob(blob);
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsRecording(false);
    };

    return recorder;
  };

  const stopRecordingAndGetBlob = () => new Promise((resolve) => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      resolve(audioBlob);
      return;
    }

    recorder.addEventListener("stop", () => {
      const type = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      setAudioBlob(blob);
      resolve(blob);
    }, { once: true });

    recorder.stop();
  });

  const uploadAudioRecording = async (blob) => {
    if (!blob?.size) return;

    const formData = new FormData();
    const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
    formData.append("file", blob, `visit-${visit._id}-recording.${extension}`);
    formData.append("visitId", visit._id);
    formData.append("consentConfirmed", "true");

    await api.post("/visit-evidence/audio", formData);
    setAudioBlob(null);
  };

  if (!visit) return null;

  const customer =
    visit.customer && typeof visit.customer === "object"
      ? visit.customer
      : {};

  const isScheduled = ["scheduled", "confirmed"].includes(visit.status);
  const isInProgress = visit.status === "in_progress";
  const isCompleted = visit.status === "completed";

  const confirmArrival = async () => {
    setError("");
    setSuccess("");

    if (!recordingConsent) {
      setError("Please confirm that the customer has been informed and consented to audio recording before arrival confirmation.");
      return;
    }

    if (!navigator.geolocation) {
      setError("GPS location is not supported by this browser.");
      return;
    }

    setLoadingArrival(true);

    let preparedRecorder;
    try {
      preparedRecorder = await startRecording();
    } catch (micError) {
      setError(micError.message || "Microphone permission is required to record this visit.");
      setLoadingArrival(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await api.patch(
            `/visits/${visit._id}/arrival`,
            {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }
          );

          preparedRecorder.start(1000);
          setIsRecording(true);
          setRecordingSeconds(0);
          setSuccess("Arrival confirmed. Audio recording is now active.");
          onUpdated?.(response.data.visit);
        } catch (err) {
          preparedRecorder.stream?.getTracks?.().forEach((track) => track.stop());
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setError(
            err.response?.data?.message ||
              "Unable to confirm your arrival. Please try again."
          );
        } finally {
          setLoadingArrival(false);
        }
      },
      (geoError) => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const messages = {
          1: "Location permission was denied. Please allow GPS access.",
          2: "Your current location could not be determined.",
          3: "GPS request timed out. Please try again.",
        };

        setError(
          messages[geoError.code] ||
            "Unable to access your current location."
        );
        setLoadingArrival(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const completeVisit = async (event) => {
    event.preventDefault();

    if (!visitOutcome) {
      setError("Please select the visit outcome.");
      return;
    }

    setError("");
    setSuccess("");
    setLoadingCompletion(true);

    try {
      if (isRecording) {
        setAudioSaving(true);
        const recordingBlob = await stopRecordingAndGetBlob();
        await uploadAudioRecording(recordingBlob);
        setAudioSaving(false);
      } else if (!audioBlob) {
        throw new Error("No visit recording is available. Please ensure recording started after arrival.");
      } else {
        setAudioSaving(true);
        await uploadAudioRecording(audioBlob);
        setAudioSaving(false);
      }

      const response = await api.patch(
        `/visits/${visit._id}/complete`,
        {
          visitOutcome,
          visitFeedback: visitFeedback.trim(),
        }
      );

      setSuccess("Property visit completed successfully.");
      onUpdated?.(response.data.visit);
    } catch (err) {
      setAudioSaving(false);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to complete this visit. Please try again."
      );
    } finally {
      setLoadingCompletion(false);
    }
  };

  return (
    <div className="lm-visit-details-overlay">
      <section
        className="lm-visit-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lm-visit-details-title"
      >
        <header className="lm-visit-details-header">
          <div>
            <span className="lm-visit-details-eyebrow">
              LUMINEST · FIELD OPERATIONS
            </span>
            <h2 id="lm-visit-details-title">Visit Details</h2>
            <p>Review and update your assigned property visit.</p>
          </div>

          <button
            type="button"
            className="lm-visit-details-close"
            onClick={onClose}
            aria-label="Close visit details"
          >
            ×
          </button>
        </header>

        <div className="lm-visit-details-body">
          {error && (
            <div className="lm-visit-details-alert error">
              {error}
            </div>
          )}

          {success && (
            <div className="lm-visit-details-alert success">
              {success}
            </div>
          )}

          <section className="lm-visit-details-section">
            <div className="lm-visit-details-section-heading">
              <h3>Customer Information</h3>
            </div>

            <div className="lm-visit-details-grid">
              <div>
                <span>Customer Name</span>
                <strong>{customer.name || "Not available"}</strong>
              </div>

              <div>
                <span>Phone Number</span>
                <strong><CustomerPhoneActions phone={customer.phone} /></strong>
              </div>

              <div>
                <span>Email Address</span>
                <strong>{customer.email || "Not available"}</strong>
              </div>
            </div>
          </section>

          <section className="lm-visit-details-section">
            <div className="lm-visit-details-section-heading">
              <h3>Property Information</h3>
            </div>

            <div className="lm-visit-details-grid">
              <div>
                <span>Property Name</span>
                <strong>{visit.propertyName}</strong>
              </div>

              <div className="lm-visit-details-full">
                <span>Property Address</span>
                <strong>{visit.propertyAddress}</strong>
              </div>

              <div>
                <span>Scheduled Date</span>
                <strong>{formatDate(visit.scheduledDate)}</strong>
              </div>

              <div>
                <span>Scheduled By</span>
                <strong>
                  {visit.scheduledBy?.name || "Not available"}
                </strong>
              </div>

              <div className="lm-visit-details-full">
                <span>Visit Notes</span>
                <strong>{visit.notes || "No additional notes"}</strong>
              </div>
            </div>
          </section>

          <section className="lm-visit-details-section">
            <div className="lm-visit-details-section-heading">
              <h3>Visit Progress</h3>
              <span className={`lm-visit-details-status ${visit.status}`}>
                {formatStatus(visit.status)}
              </span>
            </div>

            <div className="lm-visit-details-grid">
              <div>
                <span>Arrival Time</span>
                <strong>{formatDate(visit.actualArrivalTime)}</strong>
              </div>

              <div>
                <span>Completion Time</span>
                <strong>{formatDate(visit.actualCompletionTime)}</strong>
              </div>

              <div>
                <span>Arrival Latitude</span>
                <strong>
                  {visit.arrivalLatitude ?? "Not recorded"}
                </strong>
              </div>

              <div>
                <span>Arrival Longitude</span>
                <strong>
                  {visit.arrivalLongitude ?? "Not recorded"}
                </strong>
              </div>
            </div>
          </section>

          {isScheduled && (
            <section className="lm-visit-details-action">
              <h3>Confirm Property Arrival</h3>
              <p>
                When you reach the property, confirm your arrival.
                Luminest will capture your current GPS coordinates.
              </p>

              <label className="lm-visit-audio-consent">
                <input
                  type="checkbox"
                  checked={recordingConsent}
                  onChange={(event) => setRecordingConsent(event.target.checked)}
                />
                <span>
                  I confirm that the customer has been informed about this audio recording and has consented. I understand recording starts after arrival is confirmed.
                </span>
              </label>

              <button
                type="button"
                className="lm-visit-details-primary"
                onClick={confirmArrival}
                disabled={loadingArrival}
              >
                {loadingArrival
                  ? "Capturing GPS Location..."
                  : "Confirm Arrival with GPS"}
              </button>
            </section>
          )}

          {isInProgress && (
            <section className={`lm-visit-audio-status ${isRecording ? "recording" : "stopped"}`}>
              <strong>{isRecording ? "● Audio recording in progress" : audioBlob ? "Recording ready to upload" : "Audio recording not active"}</strong>
              <span>{Math.floor(recordingSeconds / 60).toString().padStart(2, "0")}:{(recordingSeconds % 60).toString().padStart(2, "0")}</span>
              <small>Keep this visit page open and your device awake. Browser recording may stop if the tab is closed, suspended or the device is locked.</small>
            </section>
          )}

          {isInProgress && (
            <section className="lm-visit-details-action">
              <h3>Complete Property Visit</h3>
              <p>
                Record the customer's response and meeting feedback
                before completing this visit.
              </p>

              <form onSubmit={completeVisit}>
                <label htmlFor="lm-visit-outcome">
                  Visit Outcome
                </label>

                <select
                  id="lm-visit-outcome"
                  value={visitOutcome}
                  onChange={(event) =>
                    setVisitOutcome(event.target.value)
                  }
                  required
                >
                  <option value="">Select visit outcome</option>
                  {OUTCOMES.map((outcome) => (
                    <option
                      key={outcome.value}
                      value={outcome.value}
                    >
                      {outcome.label}
                    </option>
                  ))}
                </select>

                <label htmlFor="lm-visit-feedback">
                  Customer Feedback
                </label>

                <textarea
                  id="lm-visit-feedback"
                  rows="4"
                  value={visitFeedback}
                  onChange={(event) =>
                    setVisitFeedback(event.target.value)
                  }
                  placeholder="Enter meeting details, customer feedback and next steps..."
                />

                <button
                  type="submit"
                  className="lm-visit-details-primary"
                  disabled={loadingCompletion || isRecording === false && !audioBlob}
                >
                  {loadingCompletion
                    ? audioSaving ? "Saving visit recording..." : "Completing Visit..."
                    : "Complete Property Visit"}
                </button>
              </form>
            </section>
          )}

          {isCompleted && (
            <section className="lm-visit-details-action completed">
              <h3>Visit Completed</h3>
              <p>
                Outcome:{" "}
                <strong>{formatStatus(visit.visitOutcome)}</strong>
              </p>
              <p>
                Feedback:{" "}
                {visit.visitFeedback || "No feedback recorded"}
              </p>
            </section>
          )}

          <EvidenceUploader
            visit={visit}
            onUploaded={() => {
              setSuccess("Visit evidence uploaded successfully.");
            }}
          />
        </div>

        <footer className="lm-visit-details-footer">
          <button type="button" onClick={onClose}>
            Close Details
          </button>
        </footer>
      </section>
    </div>
  );
}
