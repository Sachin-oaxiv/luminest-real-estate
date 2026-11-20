import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["work_from_home", "outside_work", "temporary_extension", "full_day"], required: true },
  reason: { type: String, required: true, trim: true, maxlength: 500 },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true, index: true },
  status: { type: String, enum: ["approved", "revoked", "expired"], default: "approved", index: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  revokedAt: { type: Date, default: null },
}, { timestamps: true });

permissionSchema.index({ employee: 1, status: 1, startAt: 1, endAt: 1 });
export default mongoose.models.SpecialPermission || mongoose.model("SpecialPermission", permissionSchema);
