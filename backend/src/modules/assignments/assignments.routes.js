
import express from "express";

import {
  assignCustomer,
  getAllAssignments,
  getMyAssignedCustomers,
  getMyFollowUps,
  getAvailableInsideSalesEmployees,
} from "./assignments.controller.js";

import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";

const router = express.Router();

// All assignment routes require authentication
router.use(authMiddleware);

// Admin and Executive can load active Inside Sales employees for assignment.
router.get(
  "/available-employees",
  roleMiddleware("admin", "executive"),
  getAvailableInsideSalesEmployees
);

// Admin and Executive can assign customers
router.post(
  "/",
  roleMiddleware("admin", "executive"),
  assignCustomer
);

// Admin and Executive can view all assignments
router.get(
  "/",
  roleMiddleware("admin", "executive"),
  getAllAssignments
);

// Inside Sales can view only their own assigned customers
router.get(
  "/my-customers",
  roleMiddleware("inside_sales"),
  getMyAssignedCustomers
);

// Inside Sales can view their own follow-ups
router.get(
  "/my-follow-ups",
  roleMiddleware("inside_sales"),
  getMyFollowUps
);
export default router;
