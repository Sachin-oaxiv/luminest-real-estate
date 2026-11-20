
import express from "express";

import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";
import upload from "../../middlewares/uploadMiddleware.js";
import audioUpload from "../../middlewares/audioUploadMiddleware.js";
import audioFileValidationMiddleware from "../../middlewares/audioFileValidationMiddleware.js";
import fileValidationMiddleware from "../../middlewares/fileValidationMiddleware.js";

import {
  createVisitEvidence,
  createVisitAudioRecording,
  getVisitEvidence,
  deleteVisitEvidence,
  getMyVisitEvidence,
} from "./visitEvidence.controller.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware("outside_sales"));

// Upload photo, document or other evidence
router.post(
  "/",
  upload.single("file"),
  fileValidationMiddleware,
  createVisitEvidence
);

// Upload consent-confirmed visit audio recording
router.post(
  "/audio",
  audioUpload.single("file"),
  audioFileValidationMiddleware,
  createVisitAudioRecording
);

// View evidence uploaded by the logged-in employee
router.get("/my", getMyVisitEvidence);

// View evidence for a specific visit
router.get("/:visitId", getVisitEvidence);

// Delete evidence
router.delete("/:evidenceId", deleteVisitEvidence);

export default router;
