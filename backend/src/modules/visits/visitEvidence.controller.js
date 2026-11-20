
import mongoose from "mongoose";
import VisitEvidence from "../../models/VisitEvidence.js";
import uploadToCloudinary, {
  deleteFromCloudinary,
} from "../../services/cloudinaryUpload.js";

import {
  createVisitEvidence as createVisitEvidenceService,
  getVisitEvidence as getVisitEvidenceService,
  getMyVisitEvidence as getMyVisitEvidenceService,
  deleteVisitEvidence as deleteVisitEvidenceService,
} from "./visitEvidence.service.js";


export const createVisitEvidence = async (req, res) => {
  try {
    const {
      visitId,
      evidenceType,
      description,
      capturedAt,
      latitude,
      longitude,
    } = req.body;

    if (!visitId || !evidenceType || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Visit ID, evidence type and file are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(visitId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visit ID",
      });
    }

    const allowedTypes = [
      "property_photo",
      "customer_photo",
      "document",
      "other",
    ];

    if (!allowedTypes.includes(evidenceType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid evidence type",
      });
    }

    const parsedCapturedAt = capturedAt
      ? new Date(capturedAt)
      : null;

    if (capturedAt && Number.isNaN(parsedCapturedAt.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid capture date",
      });
    }

    if (
      (latitude != null && !Number.isFinite(Number(latitude))) ||
      (longitude != null && !Number.isFinite(Number(longitude))) ||
      ((latitude == null) !== (longitude == null))
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide valid latitude and longitude together",
      });
    }

    if (
      (latitude != null &&
        (Number(latitude) < -90 || Number(latitude) > 90)) ||
      (longitude != null &&
        (Number(longitude) < -180 || Number(longitude) > 180))
    ) {
      return res.status(400).json({
        success: false,
        message: "GPS coordinates are out of range",
      });
    }

   
const uploadedFile = await uploadToCloudinary(req.file.buffer);

let evidence;

try {
  evidence = await createVisitEvidenceService({
    visitId,
    uploadedBy: req.user._id,
    evidenceType,
    fileName: req.file.originalname,
    fileUrl: uploadedFile.fileUrl,
    publicId: uploadedFile.publicId,
    resourceType: uploadedFile.resourceType,
    mimeType: req.file.detectedMimeType,
    fileSize: uploadedFile.bytes,
    description,
    capturedAt: parsedCapturedAt,
    latitude: latitude == null ? null : Number(latitude),
    longitude: longitude == null ? null : Number(longitude),
  });
} catch (databaseError) {
  try {
    await deleteFromCloudinary(
    uploadedFile.publicId,
    uploadedFile.resourceType
    );

  } catch (cleanupError) {
    console.error("Cloudinary cleanup failed:", cleanupError);
  }

  throw databaseError;
}

    return res.status(201).json({
      success: true,
      message: "Visit evidence uploaded successfully",
      evidence,
    });
  } catch (error) {
    console.error("Visit evidence upload error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};



export const createVisitAudioRecording = async (req, res) => {
  let uploadedFile;

  try {
    const { visitId, consentConfirmed } = req.body;

    if (!visitId || consentConfirmed !== "true" || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Visit, employee consent and audio file are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(visitId)) {
      return res.status(400).json({ success: false, message: "Invalid visit ID." });
    }

    uploadedFile = await uploadToCloudinary(
      req.file.buffer,
      "real-estate/visit-audio",
      "video"
    );

    const evidence = await createVisitEvidenceService({
      visitId,
      uploadedBy: req.user._id,
      evidenceType: "audio_recording",
      fileName: req.file.originalname || `visit-recording-${Date.now()}.webm`,
      fileUrl: uploadedFile.fileUrl,
      publicId: uploadedFile.publicId,
      resourceType: uploadedFile.resourceType,
      mimeType: req.file.detectedMimeType,
      fileSize: uploadedFile.bytes,
      description: "Visit audio recording. Employee confirmed consent before recording.",
      capturedAt: new Date(),
      latitude: null,
      longitude: null,
    });

    return res.status(201).json({
      success: true,
      message: "Visit audio recording saved successfully.",
      evidence,
    });
  } catch (error) {
    if (uploadedFile?.publicId) {
      try {
        await deleteFromCloudinary(uploadedFile.publicId, uploadedFile.resourceType);
      } catch (cleanupError) {
        console.error("Audio cleanup failed:", cleanupError);
      }
    }

    console.error("Visit audio upload error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to save visit audio recording.",
    });
  }
};

export const getVisitEvidence = async (req, res) => {
  try {
    const { visitId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(visitId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visit ID",
      });
    }

    const evidence = await getVisitEvidenceService(
      visitId,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      count: evidence.length,
      evidence,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyVisitEvidence = async (req, res) => {
  try {
    const evidence = await getMyVisitEvidenceService(req.user._id);

    return res.status(200).json({
      success: true,
      count: evidence.length,
      evidence,
    });
  } catch (error) {
    console.error("Get my visit evidence error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteVisitEvidence = async (req, res) => {
  try {
    const { evidenceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(evidenceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid evidence ID",
      });
    }

    const evidence = await deleteVisitEvidenceService(
      evidenceId,
      req.user._id
    );

    // Older records may not contain Cloudinary identifiers.
    if (!evidence.publicId || !evidence.resourceType) {
      return res.status(409).json({
        success: false,
        message: "Cloudinary identifiers are missing for this evidence",
      });
    }

    // Delete the actual file from Cloudinary first.
    const cloudinaryResult = await deleteFromCloudinary(
      evidence.publicId,
      evidence.resourceType
    );

    if (cloudinaryResult.result !== "ok") {
      return res.status(502).json({
        success: false,
        message: "Cloudinary file deletion could not be confirmed",
      });
    }

    // Delete the MongoDB record only after Cloudinary succeeds.
    await VisitEvidence.findByIdAndDelete(evidenceId);

    return res.status(200).json({
      success: true,
      message: "Visit evidence deleted successfully",
    });
  } catch (error) {
    console.error("Delete visit evidence error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
