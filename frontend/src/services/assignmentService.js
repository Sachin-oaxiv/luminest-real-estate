
import api from "./api.js";

// Get all customer assignments
const getAllAssignments = async () => {
  const response = await api.get("/assignments");
  return response.data.assignments;
};

// Assign or reassign a customer
const assignCustomer = async (customerId, employeeId) => {
  const response = await api.post("/assignments", {
    customerId,
    employeeId,
  });

  return response.data;
};

const assignmentService = {
  getAllAssignments,
  assignCustomer,
};

export default assignmentService;
