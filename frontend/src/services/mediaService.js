
import api from "./api.js";

const getAllMedia = async (filters = {}) => {
  const params = {};

  if (filters.search?.trim()) {
    params.search = filters.search.trim();
  }

  if (filters.evidenceType && filters.evidenceType !== "all") {
    params.evidenceType = filters.evidenceType;
  }

  if (filters.uploadedBy && filters.uploadedBy !== "all") {
    params.uploadedBy = filters.uploadedBy;
  }

  if (filters.dateFrom) {
    params.dateFrom = filters.dateFrom;
  }

  if (filters.dateTo) {
    params.dateTo = filters.dateTo;
  }

  params.page = filters.page || 1;
  params.limit = filters.limit || 12;

  const response = await api.get("/media", { params });

  return response.data;
};

const mediaService = {
  getAllMedia,
};

export default mediaService;
