
import express from "express";

import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";

import {
  getDashboardOverview,
  getEmployeeOverview,
  getCustomerOverview,
  getVisitOverview,
  getRecentActivities,
} from "./dashboard.controller.js";

const router = express.Router();

// Only authenticated Admin users can access dashboard APIs
router.use(authMiddleware, roleMiddleware("admin"));

// GET dashboard overview
router.get("/overview", getDashboardOverview);

router.get("/employees", getEmployeeOverview);

router.get("/customers", getCustomerOverview);

router.get("/visits", getVisitOverview);

router.get("/activities", getRecentActivities);

export default router;
