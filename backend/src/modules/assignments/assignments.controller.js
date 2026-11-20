
import mongoose from "mongoose";

import {
  assignCustomer as assignCustomerService,
  getAllAssignments as getAllAssignmentsService,
  getMyAssignedCustomers as getMyAssignedCustomersService,
  getMyFollowUps as getMyFollowUpsService,
  getAvailableInsideSalesEmployees as getAvailableInsideSalesEmployeesService,
} from "./assignments.service.js";

// Assign customer to an Inside Sales employee
export const assignCustomer = async (req, res) => {
  try {
    const { customerId, employeeId } = req.body;

    if (!customerId || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and employee ID are required",
      });
    }

    if (
      !mongoose.isValidObjectId(customerId) ||
      !mongoose.isValidObjectId(employeeId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID or employee ID",
      });
    }

    const customer = await assignCustomerService(
      customerId,
      employeeId
    );

    return res.status(200).json({
      success: true,
      message: "Customer assigned successfully",
      customer,
    });
  } catch (error) {
    console.error("Assign customer error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to assign customer",
    });
  }
};

// Get all customer assignments
export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await getAllAssignmentsService();

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Get assignments error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch assignments",
    });
  }
};

// Get customers assigned to the logged-in Inside Sales employee
export const getMyAssignedCustomers = async (req, res) => {
  try {
    const customers = await getMyAssignedCustomersService(req.user._id);

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get my assigned customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your assigned customers",
    });
  }
};


export const getMyFollowUps = async (req, res) => {
  try {
    const followUps = await getMyFollowUpsService(req.user._id);

    return res.status(200).json({
      success: true,
      count: followUps.length,
      followUps,
    });
  } catch (error) {
    console.error("Get follow-ups error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch follow-ups",
    });
  }
};


/**
 * Get active Inside Sales employees for the Admin / Executive assignment UI.
 * This deliberately returns only the fields needed by the assignment selector.
 */
export const getAvailableInsideSalesEmployees = async (req, res) => {
  try {
    const employees = await getAvailableInsideSalesEmployeesService();

    return res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    console.error("Get available Inside Sales employees error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch available Inside Sales employees",
    });
  }
};
