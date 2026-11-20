import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  loginAt: { type: Date, required: true, default: Date.now },
  logoutAt: { type: Date, default: null },
  loginLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  lastLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    checkedAt: { type: Date, default: Date.now },
  },
  logoutReason: { type: String, default: null },
  status: { type: String, enum: ["active", "logged_out"], default: "active", index: true },
}, { timestamps: true });

attendanceSchema.index({ employee: 1, status: 1 });

export default mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
