
import Customer from "../../models/Customer.js";
import CallActivity from "../../models/CallActivity.js";
import Message from "../../models/Message.js";
import Visit from "../../models/Visit.js";

// Create a new customer
export const createCustomer = async (customerData) => {
  const customer = await Customer.create(customerData);
  return customer;
};

// Get all customers
export const getAllCustomers = async () => {
  return await Customer.find({ isActive: true })
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role")
    .sort({ createdAt: -1 });
};

// Get one customer by ID
export const getCustomerById = async (customerId) => {
  const customer = await Customer.findOne({
    _id: customerId,
    isActive: true,
  })
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role");

  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  return customer;
};

// Update customer details
export const updateCustomer = async (customerId, updateData) => {
  const customer = await Customer.findOne({
    _id: customerId,
    isActive: true,
  });

  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  const allowedFields = [
    "name",
    "phone",
    "email",
    "interestedProperty",
    "budgetMin",
    "budgetMax",
    "preferredLocation",
    "notes",
    "status",
  ];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      customer[field] = updateData[field];
    }
  }

  await customer.save();
  return customer;
};

// Deactivate customer (soft delete)
export const deactivateCustomer = async (customerId) => {
  const customer = await Customer.findOne({
    _id: customerId,
    isActive: true,
  });

  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  customer.isActive = false;
  await customer.save();

  return customer;
};

// Reactivate customer
export const reactivateCustomer = async (customerId) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  customer.isActive = true;
  await customer.save();

  return customer;
};

// Get all customers for Admin (active and inactive)
export const getAllCustomersForAdmin = async () => {
  return await Customer.find({})
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role")
    .sort({ createdAt: -1 });
};

// Permanently delete a customer only when no linked records exist
export const permanentlyDeleteCustomer = async (customerId) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  const [callActivityExists, messageExists, visitExists] =
    await Promise.all([
      CallActivity.exists({ customer: customerId }),
      Message.exists({ customer: customerId }),
      Visit.exists({ customer: customerId }),
    ]);

  if (callActivityExists || messageExists || visitExists) {
    const error = new Error(
      "This customer has linked call activities, messages, or visits. Deactivate the customer instead of permanently deleting it."
    );
    error.statusCode = 409;
    throw error;
  }

  await Customer.findByIdAndDelete(customerId);

  return customer;
};
