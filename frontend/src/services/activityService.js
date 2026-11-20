
import api from "./api.js";

const getAllActivities = async (filters = {}) => {
  const params = {};

  if (filters.type && filters.type !== "all") {
    params.type = filters.type;
  }

  if (filters.employeeId) {
    params.employeeId = filters.employeeId;
  }

  if (filters.customerId) {
    params.customerId = filters.customerId;
  }

  if (filters.from) {
    params.from = filters.from;
  }

  if (filters.to) {
    params.to = filters.to;
  }

  const response = await api.get("/activities", {
    params,
  });

  return response.data;
};

const activityService = {
  getAllActivities,
};

export default activityService;
