
import CallActivity from "../../models/CallActivity.js";
import Message from "../../models/Message.js";
import Visit from "../../models/Visit.js";
import VisitEvidence from "../../models/VisitEvidence.js";

const buildDateFilter = (from, to) => {
  if (!from && !to) return {};

  const date = {};

  if (from) {
    date.$gte = new Date(from);
  }

  if (to) {
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);
    date.$lte = endDate;
  }

  return date;
};

export const getAllActivities = async (filters = {}) => {
  const { type, employeeId, customerId, from, to } = filters;

  const dateFilter = buildDateFilter(from, to);

  const activities = [];

  // 1. Fetch call activities
  if (!type || type === "call") {
    const query = {};

    if (employeeId) query.employee = employeeId;
    if (customerId) query.customer = customerId;
    if (Object.keys(dateFilter).length) {
      query.callDate = dateFilter;
    }

    const calls = await CallActivity.find(query)
      .populate("customer", "name phone email")
      .populate("employee", "name email role")
      .sort({ callDate: -1 })
      .lean();

    calls.forEach((call) => {
      activities.push({
        id: call._id,
        type: "call",
        date: call.callDate,
        customer: call.customer,
        employee: call.employee,
        status: call.callStatus,
        title: "Customer Call",
        description: call.notes || "",
        details: {
          duration: call.duration,
          interestStatus: call.interestStatus,
          followUpDate: call.followUpDate,
        },
      });
    });
  }

  // 2. Fetch WhatsApp messages
  if (!type || type === "message") {
    const query = {};

    if (employeeId) query.employee = employeeId;
    if (customerId) query.customer = customerId;
    if (Object.keys(dateFilter).length) {
      query.createdAt = dateFilter;
    }

    const messages = await Message.find(query)
      .populate("customer", "name phone email")
      .populate("employee", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    messages.forEach((message) => {
      activities.push({
        id: message._id,
        type: "message",
        date: message.sentAt || message.createdAt,
        customer: message.customer,
        employee: message.employee,
        status: message.deliveryStatus,
        title: "WhatsApp Message",
        description: message.messageContent,
        details: {
          channel: message.channel,
          messageType: message.messageType,
          sentAt: message.sentAt,
          deliveredAt: message.deliveredAt,
          readAt: message.readAt,
          failureReason: message.failureReason,
        },
      });
    });
  }

  // 3. Fetch property visits
  if (!type || type === "visit") {
    const query = {};

    if (employeeId) {
      query.$or = [
        { assignedTo: employeeId },
        { scheduledBy: employeeId },
      ];
    }

    if (customerId) query.customer = customerId;
    if (Object.keys(dateFilter).length) {
      query.scheduledDate = dateFilter;
    }

    const visits = await Visit.find(query)
      .populate("customer", "name phone email")
      .populate("assignedTo", "name email role")
      .populate("scheduledBy", "name email role")
      .sort({ scheduledDate: -1 })
      .lean();

    const visitIds = visits.map((visit) => visit._id);

    const evidenceRecords = visitIds.length
      ? await VisitEvidence.find({ visit: { $in: visitIds } })
          .populate("uploadedBy", "name email role")
          .sort({ createdAt: -1 })
          .lean()
      : [];

    const evidenceByVisit = new Map();

    evidenceRecords.forEach((evidence) => {
      const key = evidence.visit.toString();

      if (!evidenceByVisit.has(key)) {
        evidenceByVisit.set(key, []);
      }

      evidenceByVisit.get(key).push(evidence);
    });

    visits.forEach((visit) => {
      activities.push({
        id: visit._id,
        type: "visit",
        date: visit.scheduledDate,
        customer: visit.customer,
        employee: visit.assignedTo,
        status: visit.status,
        title: visit.propertyName || "Property Visit",
        description: visit.propertyAddress || "",
        details: {
          scheduledBy: visit.scheduledBy,
          actualArrivalTime: visit.actualArrivalTime,
          actualCompletionTime: visit.actualCompletionTime,
          actualDepartureTime: visit.actualDepartureTime,
          arrivalLatitude: visit.arrivalLatitude,
          arrivalLongitude: visit.arrivalLongitude,
          visitOutcome: visit.visitOutcome,
          visitFeedback: visit.visitFeedback,
          notes: visit.notes,
          evidence: evidenceByVisit.get(visit._id.toString()) || [],
        },
      });
    });
  }

  activities.sort(
    (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
  );

  return activities;
};
