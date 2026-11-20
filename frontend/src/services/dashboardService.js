
import api from "./api.js";

const getDashboardOverview = async () => {
  const response = await api.get("/dashboard/overview");
  return response.data.overview;
};

const getDashboardCustomers = async () => {
  const response = await api.get("/dashboard/customers");
  return response.data.customers;
};

const getDashboardVisits = async () => {
  const response = await api.get("/dashboard/visits");
  return response.data.visits;
};

const getRecentActivities = async () => {
  const response = await api.get("/dashboard/activities");
  return response.data.activities;
};

const getAnnouncements = async () => {
  const response = await api.get("/announcements");
  return response.data.announcements;
};

const dashboardService = {
  getDashboardOverview,
  getDashboardCustomers,
  getDashboardVisits,
  getRecentActivities,
  getAnnouncements,
};

export default dashboardService;
