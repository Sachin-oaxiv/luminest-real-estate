
import api from "./api.js";

const getMyCallActivities = async () => {
  const response = await api.get("/call-activities/my");
  return response.data;
};

const callActivityService = {
  getMyCallActivities,
};

export default callActivityService;
