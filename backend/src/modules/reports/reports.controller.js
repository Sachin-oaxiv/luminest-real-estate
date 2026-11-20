
import {
  getEmployeePerformanceReport as getEmployeePerformanceReportService,
} from "./reports.service.js";
import {
  getCustomerPerformanceReport as getCustomerPerformanceReportService,
} from "./reports.service.js";
import {
  getVisitPerformanceReport as getVisitPerformanceReportService,
} from "./reports.service.js";
import {
  getSalesConversionReport as getSalesConversionReportService,
} from "./reports.service.js";
export const getEmployeePerformanceReport = async (req, res) => {
  try {
    const report = await getEmployeePerformanceReportService();

    return res.status(200).json({
      success: true,
      message: "Employee performance report generated successfully",
      count: report.length,
      report,
    });
  } catch (error) {
    console.error("Employee performance report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate employee performance report",
    });
  }
};


export const getCustomerPerformanceReport = async (req, res) => {
  try {
    const report = await getCustomerPerformanceReportService();

    return res.status(200).json({
      success: true,
      message: "Customer performance report generated successfully",
      report,
    });
  } catch (error) {
    console.error("Customer performance report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate customer performance report",
    });
  }
};


export const getVisitPerformanceReport = async (req, res) => {
  try {
    const report = await getVisitPerformanceReportService();

    return res.status(200).json({
      success: true,
      message: "Visit performance report generated successfully",
      report,
    });
  } catch (error) {
    console.error("Visit performance report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate visit performance report",
    });
  }
};


export const getSalesConversionReport = async (req, res) => {
  try {
    const report = await getSalesConversionReportService();

    return res.status(200).json({
      success: true,
      message: "Sales conversion report generated successfully",
      report,
    });
  } catch (error) {
    console.error("Sales conversion report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate sales conversion report",
    });
  }
};
