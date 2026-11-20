
import mongoose from "mongoose";

import {
  createMessage as createMessageService,
  getCustomerMessages as getCustomerMessagesService,
  getMyMessages as getMyMessagesService,
  simulateMessageStatus as simulateMessageStatusService,
} from "./messages.service.js";

// Create a WhatsApp message record
export const createMessage = async (req, res) => {
  try {
    const {
      customerId,
      messageType,
      messageContent,
    } = req.body;

    if (!customerId || !messageContent?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and message content are required",
      });
    }

    if (!mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const allowedTypes = [
      "text",
      "property_details",
      "follow_up",
    ];

    if (messageType && !allowedTypes.includes(messageType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message type",
      });
    }

    const message = await createMessageService({
      customerId,
      employeeId: req.user._id,
      messageType: messageType || "text",
      messageContent,
    });

    return res.status(201).json({
      success: true,
      message: "Message record created successfully",
      data: message,
    });
  } catch (error) {
    console.error("Create message error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to create message",
    });
  }
};

// Get messages for one customer
export const getCustomerMessages = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const messages = await getCustomerMessagesService(
      customerId,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Get customer messages error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to fetch customer messages",
    });
  }
};

// Get all messages created by the logged-in employee
export const getMyMessages = async (req, res) => {
  try {
    const messages = await getMyMessagesService(req.user._id);

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Get my messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your messages",
    });
  }
};

// Update simulated WhatsApp delivery status
export const simulateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const allowedStatuses = ["delivered", "read", "failed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be delivered, read, or failed",
      });
    }

    const message = await simulateMessageStatusService({
      messageId,
      employeeId: req.user._id,
      status,
    });

    return res.status(200).json({
      success: true,
      message: `Simulated message status updated to ${status}`,
      data: message,
    });
  } catch (error) {
    console.error("Simulate message status error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to update simulated message status",
    });
  }
};
