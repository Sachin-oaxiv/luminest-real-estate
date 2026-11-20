
import mongoose from "mongoose";
import { getAllActivities } from "./activities.service.js";

export const getAdminActivities = async (req, res) => {
  try {
    const {
      type,
      employeeId,
      customerId,
      from,
      to,
    } = req.query;

    const allowedTypes = ["call", "message", "visit"];

    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity type.",
      });
    }

    if (
      employeeId &&
      !mongoose.isValidObjectId(employeeId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });
    }

    if (
      customerId &&
      !mongoose.isValidObjectId(customerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    if (
      from &&
      Number.isNaN(Date.parse(from))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date.",
      });
    }

    if (
      to &&
      Number.isNaN(Date.parse(to))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date.",
      });
    }

    if (from && to && new Date(from) > new Date(to)) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date.",
      });
    }

    const activities = await getAllActivities({
      type,
      employeeId,
      customerId,
      from,
      to,
    });

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("Get admin activities error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch activities.",
    });
  }
};
