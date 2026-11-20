
import express from "express";

import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";

import {
  getAdminActivities,
} from "./activities.controller.js";

const router = express.Router();

router.use(
  authMiddleware,
  roleMiddleware("admin")
);

// Admin: view all customer activities
router.get("/", getAdminActivities);

export default router;
