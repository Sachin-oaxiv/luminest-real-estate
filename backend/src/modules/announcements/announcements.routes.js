
import express from "express";

import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";

import {
  createAnnouncement,
  getAllAnnouncements,
  getMyAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from "./announcements.controller.js";

const router = express.Router();

// All announcement routes require login
router.use(authMiddleware);

// Admin-only announcement management
router.post(
  "/",
  roleMiddleware("admin"),
  createAnnouncement
);

router.get(
  "/",
  roleMiddleware("admin"),
  getAllAnnouncements
);

// Employees can view announcements targeted to their role
router.get(
  "/my",
  roleMiddleware("admin", "executive", "inside_sales", "outside_sales"),
  getMyAnnouncements
);

router.get(
  "/:announcementId",
  roleMiddleware("admin"),
  getAnnouncementById
);

router.put(
  "/:announcementId",
  roleMiddleware("admin"),
  updateAnnouncement
);

router.delete(
  "/:announcementId",
  roleMiddleware("admin"),
  deleteAnnouncement
);



export default router;
