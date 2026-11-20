
import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    // Basic customer details
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    // Property requirements
    interestedProperty: {
      type: String,
      trim: true,
    },

    budgetMin: {
      type: Number,
      min: 0,
    },

    budgetMax: {
      type: Number,
      min: 0,
    },

    preferredLocation: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    // Customer journey status
    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "qualified",
        "visit_scheduled",
        "visited",
        "closed",
        "lost",
      ],
      default: "new",
    },
    // Latest customer interest status
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

    // Latest follow-up date
    followUpDate: {
    type: Date,
    default: null,
    },

    // Employee who manages this customer
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Employee who created this customer
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
