
import api from "./api.js";

const getEmployeePerformance = async (params = {}) => {
  const response = await api.get(
    "/reports/employee-performance",
    { params }
  );
  return response.data;
};

const getCustomerPerformance = async (params = {}) => {
  const response = await api.get(
    "/reports/customer-performance",
    { params }
  );
  return response.data;
};

const getVisitPerformance = async (params = {}) => {
  const response = await api.get(
    "/reports/visit-performance",
    { params }
  );
  return response.data;
};

const getSalesConversion = async (params = {}) => {
  const response = await api.get(
    "/reports/sales-conversion",
    { params }
  );
  return response.data;
};

const reportService = {
  getEmployeePerformance,
  getCustomerPerformance,
  getVisitPerformance,
  getSalesConversion,
};

export default reportService;
