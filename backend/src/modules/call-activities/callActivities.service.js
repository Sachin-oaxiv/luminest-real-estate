
import CallActivity from "../../models/CallActivity.js";
import Customer from "../../models/Customer.js";

// Create a call activity
export const createCallActivity = async (activityData) => {
  const {
    customerId,
    employeeId,
    callStatus,
    duration,
    interestStatus,
    notes,
    followUpDate,
  } = activityData;

  // Check customer exists and is active
  const customer = await Customer.findOne({
    _id: customerId,
    isActive: true,
    assignedTo: employeeId,
  });

  if (!customer) {
    const error = new Error(
      "Customer not found or not assigned to this employee"
    );
    error.statusCode = 404;
    throw error;
  }

  const activity = await CallActivity.create({
    customer: customerId,
    employee: employeeId,
    callStatus,
    duration,
    interestStatus,
    notes,
    followUpDate: followUpDate || null,
  });

  // Update customer status based on call outcome
 
// Update customer sales journey status
if (customer.status === "new") {
  customer.status = "contacted";
}

// Update the customer's latest interest status
customer.interestStatus = interestStatus || "thinking";

// Update the latest follow-up date
customer.followUpDate = followUpDate || null;

// Save all customer updates
await customer.save();


  return await CallActivity.findById(activity._id)
    .populate("customer", "name phone email")
    .populate("employee", "name email role");
};

// Get call activities for one customer
export const getCustomerCallActivities = async (customerId, employeeId) => {
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

  return await CallActivity.find({
    customer: customerId,
    employee: employeeId,
  })
    .populate("employee", "name email role")
    .sort({ callDate: -1 });
};

// Get all calls made by the logged-in employee
export const getMyCallActivities = async (employeeId) => {
  return await CallActivity.find({ employee: employeeId })
    .populate("customer", "name phone email")
    .sort({ callDate: -1 });
};
