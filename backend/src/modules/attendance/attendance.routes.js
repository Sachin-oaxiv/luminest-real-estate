import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import { getAdminAttendanceReport, pingLocation } from "./attendance.controller.js";

const router = express.Router();
router.post("/ping", authMiddleware, pingLocation);
router.get("/admin-report", authMiddleware, getAdminAttendanceReport);
export default router;
