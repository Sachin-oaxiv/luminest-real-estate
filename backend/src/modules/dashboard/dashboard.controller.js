
import {
  getDashboardOverview as getDashboardOverviewService,
  getEmployeeOverview as getEmployeeOverviewService,
  getCustomerOverview as getCustomerOverviewService,
  getVisitOverview as getVisitOverviewService,
  getRecentActivities as getRecentActivitiesService,
} from "./dashboard.service.js";

export const getDashboardOverview = async (req, res) => {
  try {
    const overview = await getDashboardOverviewService();

    return res.status(200).json({
      success: true,
      message: "Dashboard overview fetched successfully",
      overview,
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard overview",
    });
  }
};


export const getEmployeeOverview = async (req, res) => {
  try {
    const employees = await getEmployeeOverviewService();

    return res.status(200).json({
      success: true,
      message: "Employee overview fetched successfully",
      count: employees.length,
      employees,
    });
  } catch (error) {
    console.error("Employee overview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee overview",
    });
  }
};


export const getCustomerOverview = async (req, res) => {
  try {
    const customers = await getCustomerOverviewService();

    return res.status(200).json({
      success: true,
      message: "Customer overview fetched successfully",
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Customer overview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer overview",
    });
  }
};


export const getVisitOverview = async (req, res) => {
  try {
    const visits = await getVisitOverviewService();

    return res.status(200).json({
      success: true,
      message: "Visit overview fetched successfully",
      count: visits.length,
      visits,
    });
  } catch (error) {
    console.error("Visit overview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch visit overview",
    });
  }
};

export const getRecentActivities = async (req, res) => {
  try {
    const activities = await getRecentActivitiesService();

    return res.status(200).json({
      success: true,
      message: "Recent activities fetched successfully",
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("Recent activities error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent activities",
    });
  }
};