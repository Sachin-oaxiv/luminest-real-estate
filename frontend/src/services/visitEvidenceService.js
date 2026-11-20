
import api from "./api.js";

const getMyVisitEvidence = async () => {
  const response = await api.get("/visit-evidence/my");
  return response.data;
};

const visitEvidenceService = {
  getMyVisitEvidence,
};

export default visitEvidenceService;
