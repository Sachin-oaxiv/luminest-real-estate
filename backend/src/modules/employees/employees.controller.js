
import mongoose from "mongoose";

import {
  createEmployee as createEmployeeService,
  getAllEmployees as getAllEmployeesService,
  getEmployeeById as getEmployeeByIdService,
  updateEmployee as updateEmployeeService,
  deactivateEmployee as deactivateEmployeeService,
  reactivateEmployee as reactivateEmployeeService,
} from "./employees.service.js";

// Create employee
export const createEmployee = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const role = req.user.role === "executive" ? "inside_sales" : req.body.role;

    // Executives may create Inside Sales accounts only.
    if (req.user.role === "executive" && req.body.role && req.body.role !== "inside_sales") {
      return res.status(403).json({ success: false, message: "Executives can create Inside Sales accounts only." });
    }

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and role are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    // Create employee through service
    const employee = await createEmployeeService({
      name,
      email,
      password,
      role,
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee,
    });

  } catch (error) {
    console.error("Create employee error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to create employee",
    });
  }
};

// Get all employees
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await getAllEmployeesService(req.user.role);

    return res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });

  } catch (error) {
    console.error("Get employees error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch employees",
    });
  }
};

// Get employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await getEmployeeByIdService(id, req.user.role);

    return res.status(200).json({
      success: true,
      employee,
    });

  } catch (error) {
    console.error("Get employee error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to fetch employee",
    });
  }
};


// Update employee
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await updateEmployeeService(id, req.body, req.user.role);

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee,
    });
  } catch (error) {
    console.error("Update employee error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to update employee",
    });
  }
};

// Deactivate employee
export const deactivateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await deactivateEmployeeService(id, req.user.role);

    return res.status(200).json({
      success: true,
      message: "Employee deactivated successfully",
      employee,
    });
  } catch (error) {
    console.error("Deactivate employee error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to deactivate employee",
    });
  }
};

// Reactivate employee
export const reactivateEmployeeController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await reactivateEmployeeService(id, req.user.role);

    return res.status(200).json({
      success: true,
      message: "Employee reactivated successfully",
      employee,
    });
  } catch (error) {
    console.error("Reactivate employee error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to reactivate employee",
    });
  }
};