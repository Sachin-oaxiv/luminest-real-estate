
import api from "./api.js";

const getInsideSalesPerformance = async () => {
  const [
    customersResponse,
    callsResponse,
    followUpsResponse,
    visitsResponse,
    messagesResponse,
  ] = await Promise.all([
    api.get("/assignments/my-customers"),
    api.get("/call-activities/my"),
    api.get("/assignments/my-follow-ups"),
    api.get("/visits/my-created"),
    api.get("/messages/my"),
  ]);

  return {
    customers: customersResponse.data.customers || [],
    calls: callsResponse.data.activities || [],
    followUps: followUpsResponse.data.followUps || [],
    visits: visitsResponse.data.visits || [],
    messages: messagesResponse.data.messages || [],
  };
};

const insideSalesPerformanceService = {
  getInsideSalesPerformance,
};

export default insideSalesPerformanceService;
