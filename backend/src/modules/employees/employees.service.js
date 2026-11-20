
import User from "../../models/User.js";

// Create a new employee
export const createEmployee = async (employeeData) => {
  const { name, email, password, role } = employeeData;

  const existingEmployee = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (existingEmployee) {
    const error = new Error("An employee with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const employee = await User.create({
    name,
    email,
    password,
    role,
  });

  return {
    id: employee._id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    isActive: employee.isActive,
  };
};

// Get all employees
export const getAllEmployees = async (actorRole = "admin") => {
  const filter = actorRole === "executive" ? { role: "inside_sales" } : {};
  return await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 });
};

// Get one employee by ID
export const getEmployeeById = async (employeeId, actorRole = "admin") => {
  const employee = await User.findById(employeeId).select("-password");

  if (!employee || (actorRole === "executive" && employee.role !== "inside_sales")) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  return employee;
};

// Update employee details
export const updateEmployee = async (employeeId, updateData, actorRole = "admin") => {
  const employee = await User.findById(employeeId);

  if (!employee || (actorRole === "executive" && employee.role !== "inside_sales")) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  // Update only permitted fields
  const allowedFields = actorRole === "executive" ? ["name", "email"] : ["name", "email", "role"];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      employee[field] = updateData[field];
    }
  }

  await employee.save();

  return {
    id: employee._id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    isActive: employee.isActive,
  };
};

// Deactivate employee
export const deactivateEmployee = async (employeeId, actorRole = "admin") => {
  const employee = await User.findById(employeeId);

  if (!employee || (actorRole === "executive" && employee.role !== "inside_sales")) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  employee.isActive = false;
  await employee.save();

  return {
    id: employee._id,
    name: employee.name,
    email: employee.email,
    isActive: employee.isActive,
  };
};


// Reactivate employee
export const reactivateEmployee = async (employeeId, actorRole = "admin") => {
  const employee = await User.findById(employeeId);

  if (!employee) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  employee.isActive = true;
  await employee.save();

  return {
    id: employee._id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    isActive: employee.isActive,
  };
};
