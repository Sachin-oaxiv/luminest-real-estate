
import mongoose from "mongoose";

import {
  createVisit as createVisitService,
  getMyScheduledVisits as getMyScheduledVisitsService,
  getMyCreatedVisits as getMyCreatedVisitsService,
  confirmVisitArrival as confirmVisitArrivalService,
  completeVisit as completeVisitService,
  getActiveOutsideSalesEmployees as getActiveOutsideSalesEmployeesService,
} from "./visits.service.js";

export const getActiveOutsideSalesEmployees = async (req, res) => {
  try {
    const employees = await getActiveOutsideSalesEmployeesService();

    return res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createVisit = async (req, res) => {
  try {
    const {
      customerId,
      assignedTo,
      propertyName,
      propertyAddress,
      scheduledDate,
      notes,
    } = req.body;

    if (
      !customerId ||
      !assignedTo ||
      !propertyName ||
      !propertyAddress ||
      !scheduledDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required visit details",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(customerId) ||
      !mongoose.Types.ObjectId.isValid(assignedTo)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer or employee ID",
      });
    }

    const parsedDate = new Date(scheduledDate);

    if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled date must be a valid future date",
      });
    }

    const visit = await createVisitService({
      customerId,
      assignedTo,
      scheduledBy: req.user._id,
      propertyName,
      propertyAddress,
      scheduledDate: parsedDate,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Property visit scheduled successfully",
      visit,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyScheduledVisits = async (req, res) => {
  try {
    const visits = await getMyScheduledVisitsService(req.user._id);

    return res.status(200).json({
      success: true,
      count: visits.length,
      visits,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyCreatedVisits = async (req, res) => {
  try {
    const visits = await getMyCreatedVisitsService(req.user._id);

    return res.status(200).json({
      success: true,
      count: visits.length,
      visits,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const confirmVisitArrival = async (req, res) => {
  try {
    const { visitId } = req.params;
    const { latitude, longitude } = req.body;

    if (!mongoose.Types.ObjectId.isValid(visitId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visit ID",
      });
    }

    if (
      latitude === undefined ||
      longitude === undefined ||
      !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude))
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid GPS latitude and longitude are required",
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: "GPS coordinates are out of range",
      });
    }

    const visit = await confirmVisitArrivalService(
      visitId,
      req.user._id,
      lat,
      lng
    );

    return res.status(200).json({
      success: true,
      message: "Visit arrival confirmed successfully",
      visit,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const completeVisit = async (req, res) => {
  try {
    const { visitId } = req.params;
    const { visitOutcome, visitFeedback } = req.body;

    if (!mongoose.Types.ObjectId.isValid(visitId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visit ID",
      });
    }

    const allowedOutcomes = [
      "interested",
      "not_interested",
      "follow_up_required",
      "negotiation",
    ];

    if (!allowedOutcomes.includes(visitOutcome)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid visit outcome",
      });
    }

    if (
      visitFeedback !== undefined &&
      typeof visitFeedback !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Visit feedback must be text",
      });
    }

    const visit = await completeVisitService(
      visitId,
      req.user._id,
      visitOutcome,
      visitFeedback
    );

    return res.status(200).json({
      success: true,
      message: "Property visit completed successfully",
      visit,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
