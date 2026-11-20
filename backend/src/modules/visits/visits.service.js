
import Visit from "../../models/Visit.js";
import Customer from "../../models/Customer.js";
import User from "../../models/User.js";

// Get active Outside Sales employees for visit assignment
export const getActiveOutsideSalesEmployees = async () => {
  return await User.find({
    role: "outside_sales",
    isActive: true,
  })
    .select("name email role")
    .sort({ name: 1 });
};

// Create a property visit
export const createVisit = async (visitData) => {
  const {
    customerId,
    assignedTo,
    scheduledBy,
    propertyName,
    propertyAddress,
    scheduledDate,
    notes,
  } = visitData;

  const customer = await Customer.findOne({
    _id: customerId,
    isActive: true,
  });

  if (!customer) {
    throw new Error("Customer not found or inactive");
  }

  if (customer.assignedTo?.toString() !== scheduledBy.toString()) {
    throw new Error(
      "You can only schedule visits for your assigned customers"
    );
  }

  const employee = await User.findOne({
    _id: assignedTo,
    role: "outside_sales",
    isActive: true,
  });

  if (!employee) {
    throw new Error("Active Outside Sales employee not found");
  }

  const visit = await Visit.create({
    customer: customerId,
    assignedTo,
    scheduledBy,
    propertyName,
    propertyAddress,
    scheduledDate,
    notes,
  });

  customer.status = "visit_scheduled";
  await customer.save();

  return await Visit.findById(visit._id)
    .populate("customer", "name phone email")
    .populate("assignedTo", "name email role")
    .populate("scheduledBy", "name email role");
};

// Get all active and historical visits assigned to the logged-in employee
export const getMyScheduledVisits = async (employeeId) => {
  return await Visit.find({
    assignedTo: employeeId,
    status: {
      $in: [
        "scheduled",
        "confirmed",
        "rescheduled",
        "in_progress",
        "completed",
      ],
    },
  })
    .populate("customer", "name phone email")
    .populate("scheduledBy", "name email role")
    .sort({ scheduledDate: -1 });
};

// Get visits created by the logged-in Inside Sales employee
export const getMyCreatedVisits = async (employeeId) => {
  return await Visit.find({
    scheduledBy: employeeId,
  })
    .populate("customer", "name phone email")
    .populate("assignedTo", "name email role")
    .sort({ scheduledDate: 1 });
};

// Confirm arrival and record GPS coordinates
export const confirmVisitArrival = async (
  visitId,
  employeeId,
  latitude,
  longitude
) => {
  const visit = await Visit.findOne({
    _id: visitId,
    assignedTo: employeeId,
  });

  if (!visit) {
    throw new Error("Visit not found or not assigned to you");
  }

  if (
    visit.status !== "scheduled" &&
    visit.status !== "confirmed"
  ) {
    throw new Error("Arrival cannot be confirmed for this visit status");
  }

  if (visit.actualArrivalTime) {
    throw new Error("Arrival has already been confirmed");
  }

  visit.actualArrivalTime = new Date();
  visit.arrivalLatitude = latitude;
  visit.arrivalLongitude = longitude;
  visit.status = "in_progress";

  await visit.save();

  return await Visit.findById(visit._id)
    .populate("customer", "name phone email")
    .populate("assignedTo", "name email role")
    .populate("scheduledBy", "name email role");
};

// Complete a visit and update the customer's journey status
export const completeVisit = async (
  visitId,
  employeeId,
  visitOutcome,
  visitFeedback
) => {
  const visit = await Visit.findOne({
    _id: visitId,
    assignedTo: employeeId,
  });

  if (!visit) {
    throw new Error("Visit not found or not assigned to you");
  }

  if (visit.status !== "in_progress") {
    throw new Error("Only visits in progress can be completed");
  }

  visit.actualDepartureTime = new Date();
  visit.actualCompletionTime = new Date();
  visit.visitOutcome = visitOutcome;
  visit.visitFeedback = visitFeedback || "";
  visit.status = "completed";

  await visit.save();

  await Customer.findByIdAndUpdate(visit.customer, {
    status: "visited",
  });

  return await Visit.findById(visit._id)
    .populate("customer", "name phone email status")
    .populate("assignedTo", "name email role")
    .populate("scheduledBy", "name email role");
};
