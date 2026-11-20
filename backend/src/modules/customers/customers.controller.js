
import mongoose from "mongoose";

import {
  createCustomer as createCustomerService,
  getAllCustomers as getAllCustomersService,
  getCustomerById as getCustomerByIdService,
  updateCustomer as updateCustomerService,
  deactivateCustomer as deactivateCustomerService,
  reactivateCustomer as reactivateCustomerService,
  getAllCustomersForAdmin as getAllCustomersForAdminService,
  permanentlyDeleteCustomer as permanentlyDeleteCustomerService,
} from "./customers.service.js";

// Create customer
export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      interestedProperty,
      budgetMin,
      budgetMax,
      preferredLocation,
      notes,
    } = req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name and phone are required",
      });
    }

    if (
      budgetMin !== undefined &&
      (typeof budgetMin !== "number" || budgetMin < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum budget must be a valid non-negative number",
      });
    }

    if (
      budgetMax !== undefined &&
      (typeof budgetMax !== "number" || budgetMax < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Maximum budget must be a valid non-negative number",
      });
    }

    if (
      budgetMin !== undefined &&
      budgetMax !== undefined &&
      budgetMin > budgetMax
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum budget cannot exceed maximum budget",
      });
    }

    const customer = await createCustomerService({
      name,
      phone,
      email,
      interestedProperty,
      budgetMin,
      budgetMax,
      preferredLocation,
      notes,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create customer",
    });
  }
};

// Get all customers
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await getAllCustomersService();

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch customers",
    });
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await getCustomerByIdService(id);

    return res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Get customer error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to fetch customer",
    });
  }
};

// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await updateCustomerService(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Update customer error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to update customer",
    });
  }
};

// Deactivate customer
export const deactivateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await deactivateCustomerService(id);

    return res.status(200).json({
      success: true,
      message: "Customer deactivated successfully",
      customer,
    });
  } catch (error) {
    console.error("Deactivate customer error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to deactivate customer",
    });
  }
};


/* Reactivate customer */
export const reactivateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await reactivateCustomerService(id);

    return res.status(200).json({
      success: true,
      message: "Customer reactivated successfully",
      customer,
    });
  } catch (error) {
    console.error("Reactivate customer error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to reactivate customer",
    });
  }
};

// Get all customers for Admin (active and inactive)
export const getAllCustomersForAdmin = async (req, res) => {
  try {
    const customers = await getAllCustomersForAdminService();

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get all admin customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch customers",
    });
  }
};

// Permanently delete customer (Admin only)
export const permanentlyDeleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await permanentlyDeleteCustomerService(id);

    return res.status(200).json({
      success: true,
      message: "Customer permanently deleted successfully",
      customer: {
        id: customer._id,
        name: customer.name,
      },
    });
  } catch (error) {
    console.error("Permanently delete customer error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to permanently delete customer",
    });
  }
};