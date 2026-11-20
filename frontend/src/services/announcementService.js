
import api from "./api.js";

const getAllAnnouncements = async () => {
  const response = await api.get("/announcements");
  return response.data.announcements;
};

const getAnnouncementById = async (id) => {
  const response = await api.get(`/announcements/${id}`);
  return response.data.announcement;
};

const createAnnouncement = async (announcementData) => {
  const response = await api.post("/announcements", announcementData);
  return response.data;
};

const updateAnnouncement = async (id, announcementData) => {
  const response = await api.put(
    `/announcements/${id}`,
    announcementData
  );
  return response.data;
};

// Deactivate without permanently deleting the announcement
const deactivateAnnouncement = async (id) => {
  const response = await api.put(`/announcements/${id}`, {
    isActive: false,
  });

  return response.data;
};

// Permanently delete only when explicitly required
const deleteAnnouncement = async (id) => {
  const response = await api.delete(`/announcements/${id}`);
  return response.data;
};

const announcementService = {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deactivateAnnouncement,
  deleteAnnouncement,
};

export default announcementService;
