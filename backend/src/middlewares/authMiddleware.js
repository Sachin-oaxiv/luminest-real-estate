import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Attendance from "../modules/attendance/attendance.model.js";
import { closeAttendance } from "../modules/attendance/attendance.service.js";
import { isInsideOffice } from "../config/officeLocation.js";
import SpecialPermission from "../modules/permissions/permission.model.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, message: "Please login first" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: "Employee not found or inactive" });

    if (user.role === "inside_sales") {
      const attendanceId = decoded.attendanceId;
      const latitude = Number(req.headers["x-user-latitude"]);
      const longitude = Number(req.headers["x-user-longitude"]);
      if (!attendanceId) return res.status(401).json({ success: false, code: "ATTENDANCE_REQUIRED", message: "Your location-verified attendance session is missing. Please log in again." });
      const attendance = await Attendance.findOne({ _id: attendanceId, employee: user._id, status: "active" });
      if (!attendance) return res.status(401).json({ success: false, code: "ATTENDANCE_CLOSED", message: "Your attendance session has ended. Please log in again." });
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(403).json({ success: false, code: "LOCATION_REQUIRED", message: "Location permission is required to use the Inside Sales portal." });
      }
      const now = new Date();
      const specialPermission = await SpecialPermission.findOne({
        employee: user._id,
        status: "approved",
        startAt: { $lte: now },
        endAt: { $gt: now },
      }).select("_id type endAt");
      const check = isInsideOffice(latitude, longitude);
      if (!check.allowed && !specialPermission) {
        await closeAttendance(attendanceId, "left_office_geofence");
        return res.status(403).json({ success: false, code: "OUTSIDE_GEOFENCE", distance: check.distance, radiusMeters: check.radiusMeters, message: `Access blocked. You are approximately ${check.distance} metres from the office. Your attendance has been logged out.` });
      }
      req.auth = { attendanceId, specialPermission: specialPermission ? { id: specialPermission._id, type: specialPermission.type, endAt: specialPermission.endAt } : null };
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export default authMiddleware;
