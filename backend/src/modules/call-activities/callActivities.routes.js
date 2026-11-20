
import express from "express";

import {
  createCallActivity,
  getCustomerCallActivities,
  getMyCallActivities,
} from "./callActivities.controller.js";

import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";

const router = express.Router();

// All call activity routes require Inside Sales authentication
router.use(
  authMiddleware,
  roleMiddleware("inside_sales")
);

// Record a customer call
router.post("/", createCallActivity);

// Get all calls made by the logged-in employee
router.get("/my", getMyCallActivities);

// Get call history for a particular customer
router.get("/customer/:customerId", getCustomerCallActivities);

export default router;
