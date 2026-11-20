import api from "./api.js";

export const login = async (email, password, coordinates = null) => {
  const response = await api.post("/auth/login", { email, password, ...(coordinates || {}) });
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const pingAttendanceLocation = async () => {
  const response = await api.post("/attendance/ping");
  return response.data;
};
