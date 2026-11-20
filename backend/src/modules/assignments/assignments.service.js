
import Customer from "../../models/Customer.js";
import User from "../../models/User.js";

// Assign a customer to an Inside Sales employee
export const assignCustomer = async (customerId, employeeId) => {
  const customer = await Customer.findOne({
    _id: customerId,
    isActive: true,
  });

  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  const employee = await User.findById(employeeId);

  if (!employee || !employee.isActive) {
    const error = new Error("Employee not found or inactive");
    error.statusCode = 404;
    throw error;
  }

  if (employee.role !== "inside_sales") {
    const error = new Error(
      "Customer can only be assigned to Inside Sales employees"
    );
    error.statusCode = 400;
    throw error;
  }

  customer.assignedTo = employee._id;
  await customer.save();

  return await Customer.findById(customer._id)
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role");
};

// Get all assignments
export const getAllAssignments = async () => {
  return await Customer.find({
    isActive: true,
    assignedTo: { $ne: null },
  })
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role")
    .sort({ updatedAt: -1 });
};

export const getMyAssignedCustomers = async (employeeId) => {
  return await Customer.find({
    isActive: true,
    assignedTo: employeeId,
  }).sort({ createdAt: -1 });
};


// Get follow-ups for the logged-in Inside Sales employee
export const getMyFollowUps = async (employeeId) => {
  return await Customer.find({
    isActive: true,
    assignedTo: employeeId,
    followUpDate: { $ne: null },
  })
    .select(
      "name phone email interestedProperty interestStatus followUpDate status"
    )
    .sort({ followUpDate: 1 });
};


/**
 * Return active Inside Sales users only. Admin and Executive assignment
 * screens use this endpoint instead of the Admin-only /employees endpoint.
 */
export const getAvailableInsideSalesEmployees = async () => {
  return await User.find({
    role: "inside_sales",
    isActive: true,
  })
    .select("_id name email role isActive")
    .sort({ name: 1 });
};
