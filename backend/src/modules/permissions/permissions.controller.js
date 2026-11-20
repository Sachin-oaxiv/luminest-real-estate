import mongoose from "mongoose";
import User from "../../models/User.js";
import SpecialPermission from "./permission.model.js";

export const listPermissions = async (req, res) => {
  const filter = {};
  if (req.user.role === "executive") filter.employee = { $in: await User.find({ role: "inside_sales" }).distinct("_id") };
  const rows = await SpecialPermission.find(filter)
    .populate("employee", "name email role")
    .populate("approvedBy", "name role")
    .populate("revokedBy", "name role")
    .sort({ createdAt: -1 }).limit(300);
  const now = new Date();
  const permissions = rows.map((p) => {
    const item = p.toObject();
    if (item.status === "approved" && item.endAt <= now) item.status = "expired";
    return item;
  });
  res.json({ success: true, permissions });
};

export const grantPermission = async (req, res) => {
  const { employeeId, type, reason, startAt, endAt } = req.body;
  if (!mongoose.isValidObjectId(employeeId)) return res.status(400).json({ success: false, message: "Select a valid Inside Sales employee." });
  if (!["work_from_home", "outside_work", "temporary_extension", "full_day"].includes(type)) return res.status(400).json({ success: false, message: "Select a valid permission type." });
  const start = new Date(startAt), end = new Date(endAt);
  if (!reason?.trim() || reason.trim().length > 500) return res.status(400).json({ success: false, message: "A reason (maximum 500 characters) is required." });
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) return res.status(400).json({ success: false, message: "Expiry must be later than the start time." });
  if (end - start > 24 * 60 * 60 * 1000) return res.status(400).json({ success: false, message: "A permission cannot exceed 24 hours. Create another approval if needed." });
  const employee = await User.findOne({ _id: employeeId, role: "inside_sales", isActive: true });
  if (!employee) return res.status(404).json({ success: false, message: "Active Inside Sales employee not found." });
  const permission = await SpecialPermission.create({
    employee: employee._id, type, reason: reason.trim(), startAt: start, endAt: end, approvedBy: req.user._id,
  });
  await permission.populate("employee", "name email role");
  await permission.populate("approvedBy", "name role");
  res.status(201).json({ success: true, message: "Special GPS permission approved.", permission });
};

export const revokePermission = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid permission ID." });
  const permission = await SpecialPermission.findOneAndUpdate(
    { _id: req.params.id, status: "approved" },
    { $set: { status: "revoked", revokedBy: req.user._id, revokedAt: new Date() } },
    { new: true }
  ).populate("employee", "name email").populate("revokedBy", "name role");
  if (!permission) return res.status(404).json({ success: false, message: "Active permission not found." });
  res.json({ success: true, message: "Permission revoked.", permission });
};
