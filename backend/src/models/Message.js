
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // Customer receiving the message
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    // Employee sending the message
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Message details
    channel: {
      type: String,
      enum: ["whatsapp"],
      default: "whatsapp",
    },

    messageType: {
      type: String,
      enum: [
        "text",
        "property_details",
        "follow_up",
      ],
      default: "text",
    },

    messageContent: {
      type: String,
      required: true,
      trim: true,
    },

    // Delivery tracking
    deliveryStatus: {
      type: String,
      enum: [
        "pending",
        "sent",
        "delivered",
        "read",
        "failed",
      ],
      default: "pending",
    },

    externalMessageId: {
      type: String,
      default: null,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    readAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
