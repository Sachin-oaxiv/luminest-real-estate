
import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";

import {
  getEmployeePerformanceReport,
  getCustomerPerformanceReport,
  getVisitPerformanceReport,
  getSalesConversionReport,
} from "./reports.controller.js";

const router = express.Router();

// All report routes require authentication.
router.use(authMiddleware);

// Admin and Executive can access organization reports.
router.use(roleMiddleware("admin", "executive"));

// Employee performance report
router.get(
  "/employee-performance",
  getEmployeePerformanceReport
);

// Customer performance report
router.get(
  "/customer-performance",
  getCustomerPerformanceReport
);

// Visit performance report
router.get(
  "/visit-performance",
  getVisitPerformanceReport
);

// Sales conversion report
router.get(
  "/sales-conversion",
  getSalesConversionReport
);

export default router;
