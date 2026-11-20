
import express from "express";

import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployeeController,
} from "./employees.controller.js";

import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";

const router = express.Router();

// Admin manages all roles; Executive manages Inside Sales employees only.
router.use(authMiddleware, roleMiddleware("admin", "executive"));

// Create employee
router.post("/", createEmployee);

// Get all employees
router.get("/", getAllEmployees);

// Get employee by ID
router.get("/:id", getEmployeeById);

// Update employee
router.put("/:id", updateEmployee);

// Deactivate employee
router.patch("/:id/deactivate", deactivateEmployee);

router.patch("/:id/reactivate", reactivateEmployeeController);
export default router;
