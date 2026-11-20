
import api from "./api.js";

// Get all customers for Admin
const getAllCustomers = async () => {
  const response = await api.get("/customers/admin/all");
  return response.data.customers;
};

// Get customers assigned to the logged-in Inside Sales employee
const getMyAssignedCustomers = async () => {
  const response = await api.get("/assignments/my-customers");
  return response.data.customers;
};

// Get customer by ID
const getCustomerById = async (id) => {
  const response = await api.get(`/customers/${id}`);
  return response.data.customer;
};

// Create customer
const createCustomer = async (customerData) => {
  const response = await api.post("/customers", customerData);
  return response.data;
};

// Update customer
const updateCustomer = async (id, customerData) => {
  const response = await api.put(`/customers/${id}`, customerData);
  return response.data;
};

// Deactivate customer
const deactivateCustomer = async (id) => {
  const response = await api.patch(`/customers/${id}/deactivate`);
  return response.data;
};

// Reactivate customer
const reactivateCustomer = async (id) => {
  const response = await api.patch(`/customers/${id}/reactivate`);
  return response.data;
};

// Permanently delete customer (Admin only)
const permanentlyDeleteCustomer = async (id) => {
  const response = await api.delete(`/customers/${id}/permanent`);
  return response.data;
};

const customerService = {
  getAllCustomers,
  getMyAssignedCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
  reactivateCustomer,
  permanentlyDeleteCustomer,
};

export default customerService;
