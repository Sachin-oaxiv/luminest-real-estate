
import Message from "../../models/Message.js";
import Customer from "../../models/Customer.js";

import {
  getWhatsAppConfig,
} from "../whatsapp/whatsappIntegration.service.js";

export const createMessage = async (messageData) => {
  const {
    customerId,
    employeeId,
    messageType,
    messageContent,
  } = messageData;

  const config = await getWhatsAppConfig();

  if (!config.isEnabled) {
    const error = new Error("WhatsApp integration is disabled.");
    error.statusCode = 403;
    throw error;
  }

  if (config.mode !== "simulation") {
    const error = new Error("Live WhatsApp sending is not configured.");
    error.statusCode = 400;
    throw error;
  }

  const customer = await Customer.findOne({
    _id: customerId,
    assignedTo: employeeId,
    isActive: true,
  });

  if (!customer) {
    const error = new Error(
      "Customer not found or not assigned to this employee"
    );
    error.statusCode = 404;
    throw error;
  }

  const message = await Message.create({
    customer: customerId,
    employee: employeeId,
    channel: "whatsapp",
    messageType,
    messageContent,
    deliveryStatus: "sent",
    externalMessageId: `SIMULATED_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    sentAt: new Date(),
  });

  return Message.findById(message._id)
    .populate("customer", "name phone email")
    .populate("employee", "name email role");
};

export const getCustomerMessages = async (customerId, employeeId) => {
  const customer = await Customer.findOne({
    _id: customerId,
    assignedTo: employeeId,
    isActive: true,
  });

  if (!customer) {
    const error = new Error(
      "Customer not found or not assigned to this employee"
    );
    error.statusCode = 404;
    throw error;
  }

  return Message.find({
    customer: customerId,
    employee: employeeId,
  })
    .populate("employee", "name email role")
    .sort({ createdAt: -1 });
};

export const getMyMessages = async (employeeId) => {
  return Message.find({ employee: employeeId })
    .populate("customer", "name phone email")
    .sort({ createdAt: -1 });
};

// Simulate WhatsApp delivery status
export const simulateMessageStatus = async ({
  messageId,
  employeeId,
  status,
}) => {
  const allowedStatuses = ["delivered", "read", "failed"];

  if (!allowedStatuses.includes(status)) {
    const error = new Error("Invalid simulated delivery status.");
    error.statusCode = 400;
    throw error;
  }

  const message = await Message.findOne({
    _id: messageId,
    employee: employeeId,
  });

  if (!message) {
    const error = new Error("Message not found.");
    error.statusCode = 404;
    throw error;
  }

  if (message.externalMessageId?.startsWith("SIMULATED_") !== true) {
    const error = new Error("Only simulated messages can be updated here.");
    error.statusCode = 400;
    throw error;
  }

  if (message.deliveryStatus === "failed") {
    const error = new Error("Failed messages cannot be advanced.");
    error.statusCode = 400;
    throw error;
  }

  if (status === "delivered") {
    if (message.deliveryStatus !== "sent") {
      const error = new Error("Only sent messages can be marked delivered.");
      error.statusCode = 400;
      throw error;
    }

    message.deliveryStatus = "delivered";
    message.deliveredAt = new Date();
  }

  if (status === "read") {
    if (message.deliveryStatus !== "delivered") {
      const error = new Error(
        "A message must be delivered before it can be marked read."
      );
      error.statusCode = 400;
      throw error;
    }

    message.deliveryStatus = "read";
    message.readAt = new Date();
  }

  if (status === "failed") {
    message.deliveryStatus = "failed";
    message.failureReason = "Simulated delivery failure.";
  }

  await message.save();

  return message;
};
