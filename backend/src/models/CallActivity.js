
import mongoose from "mongoose";

const callActivitySchema = new mongoose.Schema(
  {
    // Customer contacted during the call
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    // Employee who made the call
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Call details
    callDate: {
      type: Date,
      default: Date.now,
    },

    callStatus: {
      type: String,
      enum: [
        "answered",
        "not_answered",
        "busy",
        "switched_off",
        "invalid_number",
      ],
      required: true,
    },

    duration: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Customer interest after the call
    interestStatus: {
      type: String,
      enum: [
        "interested",
        "not_interested",
        "thinking",
        "callback_requested",
      ],
      default: "thinking",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    followUpDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const CallActivity = mongoose.model(
  "CallActivity",
  callActivitySchema
);

export default CallActivity;
