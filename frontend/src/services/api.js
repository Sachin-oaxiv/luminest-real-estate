import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:5000/api/v1", withCredentials: true });

// Coordinates are refreshed by AuthProvider's browser geolocation watcher.
api.interceptors.request.use((config) => {
  const raw = sessionStorage.getItem("insideSalesLocation");
  if (raw) {
    try {
      const location = JSON.parse(raw);
      config.headers["x-user-latitude"] = String(location.latitude);
      config.headers["x-user-longitude"] = String(location.longitude);
    } catch {
      sessionStorage.removeItem("insideSalesLocation");
    }
  }
  return config;
});

export default api;
