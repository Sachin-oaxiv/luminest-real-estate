import api from "./api.js";

const getAdminReport = async (filters = {}) => {
  const response = await api.get("/attendance/admin-report", { params: filters });
  return response.data;
};

const attendanceService = { getAdminReport };
export default attendanceService;
