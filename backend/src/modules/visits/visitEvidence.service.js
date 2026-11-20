
import Visit from "../../models/Visit.js";
import VisitEvidence from "../../models/VisitEvidence.js";

// Create visit evidence
export const createVisitEvidence = async (evidenceData) => {
  const {
    visitId,
    uploadedBy,
    evidenceType,
    fileName,
    fileUrl,
    publicId,
    resourceType,
    mimeType,
    fileSize,
    description,
    capturedAt,
    latitude,
    longitude,
  } = evidenceData;

  const visit = await Visit.findOne({
    _id: visitId,
    assignedTo: uploadedBy,
  });

  if (!visit) {
    throw new Error("Visit not found or not assigned to you");
  }

  if (!["in_progress", "completed"].includes(visit.status)) {
    throw new Error(
      "Evidence can only be uploaded for an active or completed visit"
    );
  }

  const evidence = await VisitEvidence.create({
    visit: visitId,
    uploadedBy,
    evidenceType,
    fileName,
    fileUrl,
    publicId,
    resourceType,
    mimeType,
    fileSize,
    description,
    capturedAt,
    latitude,
    longitude,
  });

  return await VisitEvidence.findById(evidence._id)
    .populate("visit", "propertyName propertyAddress scheduledDate")
    .populate("uploadedBy", "name email role");
};

// Get evidence for one assigned visit
export const getVisitEvidence = async (visitId, employeeId) => {
  const visit = await Visit.findOne({
    _id: visitId,
    assignedTo: employeeId,
  });

  if (!visit) {
    throw new Error("Visit not found or not assigned to you");
  }

  return await VisitEvidence.find({
    visit: visitId,
  })
    .populate("uploadedBy", "name email role")
    .sort({ createdAt: -1 });
};

// Get all evidence uploaded by the logged-in employee
export const getMyVisitEvidence = async (employeeId) => {
  return await VisitEvidence.find({
    uploadedBy: employeeId,
  })
    .populate({
      path: "visit",
      select:
        "propertyName propertyAddress scheduledDate status customer assignedTo",
      populate: {
        path: "customer",
        select: "name phone email",
      },
    })
    .populate("uploadedBy", "name email role")
    .sort({ createdAt: -1 });
};

// Delete visit evidence from MongoDB
export const deleteVisitEvidence = async (evidenceId, employeeId) => {
  const evidence = await VisitEvidence.findById(evidenceId);

  if (!evidence) {
    throw new Error("Visit evidence not found");
  }

  const visit = await Visit.findOne({
    _id: evidence.visit,
    assignedTo: employeeId,
  });

  if (!visit) {
    throw new Error("Visit not found or not assigned to you");
  }

  // Cloudinary deletion is performed by the controller first.
  return evidence;
};
