import api from "./api.js";

const permissionService = {
  async getAll() {
    const response = await api.get("/permissions");
    return response.data.permissions || [];
  },
  async grant(payload) {
    const response = await api.post("/permissions", payload);
    return response.data;
  },
  async revoke(id) {
    const response = await api.patch(`/permissions/${id}/revoke`);
    return response.data;
  },
};
export default permissionService;
