
import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    propertyName: {
      type: String,
      trim: true,
      required: true,
    },

    propertyAddress: {
      type: String,
      trim: true,
      required: true,
    },

    scheduledDate: {
      type: Date,
      required: true,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "rescheduled",
      ],
      default: "scheduled",
    },

    actualArrivalTime: {
      type: Date,
      default: null,
    },
    arrivalLatitude: {
    type: Number,
    default: null,
    min: -90,
    max: 90,
    },

    arrivalLongitude: {
    type: Number,
    default: null,
    min: -180,
    max: 180,
    },

    actualCompletionTime: {
      type: Date,
      default: null,
    },
    
    actualDepartureTime: {
    type: Date,
    default: null,
    },

    visitOutcome: {
    type: String,
    enum: [
        "interested",
        "not_interested",
        "follow_up_required",
        "negotiation",
    ],
    default: null,
    },

    visitFeedback: {
    type: String,
    trim: true,
    default: "",
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

const Visit = mongoose.model("Visit", visitSchema);

export default Visit;
