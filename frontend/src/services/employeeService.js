
import api from "./api.js";

const getAllEmployees = async () => {
  const response = await api.get("/employees");
  return response.data.employees;
};

const getEmployeeById = async (id) => {
  const response = await api.get(`/employees/${id}`);
  return response.data.employee;
};

const createEmployee = async (employeeData) => {
  const response = await api.post("/employees", employeeData);
  return response.data;
};

const updateEmployee = async (id, employeeData) => {
  const response = await api.put(`/employees/${id}`, employeeData);
  return response.data;
};

const deactivateEmployee = async (id) => {
  const response = await api.patch(`/employees/${id}/deactivate`);
  return response.data;
};

const reactivateEmployee = async (id) => {
  const response = await api.patch(`/employees/${id}/reactivate`);
  return response.data;
};

const employeeService = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
};

export default employeeService;
