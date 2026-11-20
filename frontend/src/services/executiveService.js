
import api from "./api.js";

const getDashboardData = async () => {
  const [customersResponse, assignmentsResponse] = await Promise.all([
    api.get("/customers"),
    api.get("/assignments"),
  ]);

  return {
    customers: customersResponse.data.customers || [],
    assignments: assignmentsResponse.data.assignments || [],
  };
};

const executiveService = {
  getDashboardData,
};

export default executiveService;
