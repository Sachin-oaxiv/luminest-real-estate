import User from "../../models/User.js";
import jwt from "jsonwebtoken";
import Attendance from "../attendance/attendance.model.js";
import { createAttendance, closeAttendance } from "../attendance/attendance.service.js";
import { isInsideOffice, OFFICE_LOCATION } from "../../config/officeLocation.js";
import SpecialPermission from "../permissions/permission.model.js";

const readCoordinates = (body) => {
  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isActive || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    let attendance = null;
    if (user.role === "inside_sales") {
      const coordinates = readCoordinates(req.body);
      if (!coordinates) return res.status(400).json({ success: false, code: "LOCATION_REQUIRED", message: "Enable location access to sign in. Your GPS location is required." });
      const now = new Date();
      const specialPermission = await SpecialPermission.findOne({
        employee: user._id,
        status: "approved",
        startAt: { $lte: now },
        endAt: { $gt: now },
      }).sort({ endAt: -1 });
      const check = isInsideOffice(coordinates.latitude, coordinates.longitude);
      if (!check.allowed && !specialPermission) {
        return res.status(403).json({ success: false, code: "OUTSIDE_GEOFENCE", distance: check.distance, radiusMeters: check.radiusMeters, message: `Login denied. You are approximately ${check.distance} metres from the office. You must be within ${check.radiusMeters} metres or have an active special permission.` });
      }
      await Attendance.updateMany({ employee: user._id, status: "active" }, { $set: { status: "logged_out", logoutAt: new Date(), logoutReason: "replaced_by_new_login" } });
      attendance = await createAttendance(user._id, coordinates.latitude, coordinates.longitude);
    }

    const token = jwt.sign({ userId: user._id, role: user.role, attendanceId: attendance?._id?.toString() || null }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 24 * 60 * 60 * 1000 });

    const activePermission = user.role === "inside_sales"
      ? await SpecialPermission.findOne({ employee: user._id, status: "approved", startAt: { $lte: new Date() }, endAt: { $gt: new Date() } }).select("type endAt")
      : null;
    return res.status(200).json({ success: true, message: "Login successful", user: { id: user._id, name: user.name, email: user.email, role: user.role }, geofence: user.role === "inside_sales" ? { radiusMeters: OFFICE_LOCATION.radiusMeters, temporaryLocation: true, specialPermission: activePermission ? { type: activePermission.type, endAt: activePermission.endAt } : null } : undefined });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getMe = async (req, res) => res.status(200).json({ success: true, user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === "inside_sales" && decoded.attendanceId) await closeAttendance(decoded.attendanceId, "employee_logout");
    }
  } catch (error) {
    // Always clear the cookie, even if the token has expired.
  }
  res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};
