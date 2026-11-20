
import mongoose from "mongoose";

import {
  createCallActivity as createCallActivityService,
  getCustomerCallActivities as getCustomerCallActivitiesService,
  getMyCallActivities as getMyCallActivitiesService,
} from "./callActivities.service.js";

// Create a call activity
export const createCallActivity = async (req, res) => {
  try {
    const {
      customerId,
      callStatus,
      duration,
      interestStatus,
      notes,
      followUpDate,
    } = req.body;

    if (!customerId || !callStatus) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and call status are required",
      });
    }

    if (!mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    if (
      duration !== undefined &&
      (!Number.isInteger(duration) || duration < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Duration must be a non-negative integer in seconds",
      });
    }

    if (
      followUpDate !== undefined &&
      followUpDate !== null &&
      Number.isNaN(Date.parse(followUpDate))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid follow-up date",
      });
    }

    const activity = await createCallActivityService({
      customerId,
      employeeId: req.user._id,
      callStatus,
      duration,
      interestStatus,
      notes,
      followUpDate,
    });

    return res.status(201).json({
      success: true,
      message: "Call activity recorded successfully",
      activity,
    });
  } catch (error) {
    console.error("Create call activity error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to record call activity",
    });
  }
};

// Get call history for one customer
export const getCustomerCallActivities = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const activities = await getCustomerCallActivitiesService(
      customerId,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("Get customer call activities error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to fetch call history",
    });
  }
};

// Get all calls made by the logged-in employee
export const getMyCallActivities = async (req, res) => {
  try {
    const activities = await getMyCallActivitiesService(req.user._id);

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("Get my call activities error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your call activities",
    });
  }
};
