
import Announcement from "../../models/Announcement.js";

export const createAnnouncement = async (announcementData) => {
  const announcement = await Announcement.create(announcementData);

  return await Announcement.findById(announcement._id)
    .populate("createdBy", "name email role");
};

export const getAllAnnouncements = async () => {
  return await Announcement.find()
    .populate("createdBy", "name email role")
    .sort({ createdAt: -1 });
};

export const getActiveAnnouncementsForRole = async (role) => {
  const now = new Date();

  return await Announcement.find({
    isActive: true,
    targetRoles: role,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: now } },
    ],
  })
    .populate("createdBy", "name email role")
    .sort({ createdAt: -1 });
};

export const getAnnouncementById = async (announcementId) => {
  return await Announcement.findById(announcementId)
    .populate("createdBy", "name email role");
};

export const updateAnnouncement = async (
  announcementId,
  updateData
) => {
  return await Announcement.findByIdAndUpdate(
    announcementId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  ).populate("createdBy", "name email role");
};

export const deleteAnnouncement = async (announcementId) => {
  return await Announcement.findByIdAndDelete(announcementId);
};
