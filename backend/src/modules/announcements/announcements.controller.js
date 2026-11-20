
import mongoose from "mongoose";

import {
  createAnnouncement as createAnnouncementService,
  getAllAnnouncements as getAllAnnouncementsService,
  getActiveAnnouncementsForRole as getActiveAnnouncementsForRoleService,
  getAnnouncementById as getAnnouncementByIdService,
  updateAnnouncement as updateAnnouncementService,
  deleteAnnouncement as deleteAnnouncementService,
} from "./announcements.service.js";

const allowedRoles = [
  "admin",
  "executive",
  "inside_sales",
  "outside_sales",
];

const allowedPriorities = ["low", "normal", "high"];

export const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      message,
      targetRoles,
      priority,
      expiresAt,
    } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    if (
      targetRoles !== undefined &&
      (!Array.isArray(targetRoles) ||
        targetRoles.length === 0 ||
        targetRoles.some((role) => !allowedRoles.includes(role)))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid target roles",
      });
    }

    if (
      priority !== undefined &&
      !allowedPriorities.includes(priority)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement priority",
      });
    }

    let parsedExpiresAt = null;

    if (expiresAt !== undefined && expiresAt !== null && expiresAt !== "") {
      parsedExpiresAt = new Date(expiresAt);

      if (Number.isNaN(parsedExpiresAt.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid expiry date",
        });
      }

      if (parsedExpiresAt <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Expiry date must be in the future",
        });
      }
    }

    const announcement = await createAnnouncementService({
      title: title.trim(),
      message: message.trim(),
      targetRoles,
      priority,
      expiresAt: parsedExpiresAt,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement,
    });
  } catch (error) {
    console.error("Create announcement error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create announcement",
    });
  }
};

export const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await getAllAnnouncementsService();

    return res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    console.error("Get announcements error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
    });
  }
};

export const getMyAnnouncements = async (req, res) => {
  try {
    const announcements =
      await getActiveAnnouncementsForRoleService(req.user.role);

    return res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    console.error("Get employee announcements error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
    });
  }
};

export const getAnnouncementById = async (req, res) => {
  try {
    const { announcementId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID",
      });
    }

    const announcement =
      await getAnnouncementByIdService(announcementId);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    return res.status(200).json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error("Get announcement error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch announcement",
    });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID",
      });
    }

    const {
      title,
      message,
      targetRoles,
      priority,
      isActive,
      expiresAt,
    } = req.body;

    const updateData = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }
      updateData.title = title.trim();
    }

    if (message !== undefined) {
      if (typeof message !== "string" || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: "Message cannot be empty",
        });
      }
      updateData.message = message.trim();
    }

    if (targetRoles !== undefined) {
      if (
        !Array.isArray(targetRoles) ||
        targetRoles.length === 0 ||
        targetRoles.some((role) => !allowedRoles.includes(role))
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid target roles",
        });
      }
      updateData.targetRoles = targetRoles;
    }

    if (priority !== undefined) {
      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid announcement priority",
        });
      }
      updateData.priority = priority;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean",
        });
      }
      updateData.isActive = isActive;
    }

    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === "") {
        updateData.expiresAt = null;
      } else {
        const parsedExpiresAt = new Date(expiresAt);

        if (Number.isNaN(parsedExpiresAt.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid expiry date",
          });
        }

        updateData.expiresAt = parsedExpiresAt;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const announcement = await updateAnnouncementService(
      announcementId,
      updateData
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Announcement updated successfully",
      announcement,
    });
  } catch (error) {
    console.error("Update announcement error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update announcement",
    });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID",
      });
    }

    const announcement =
      await deleteAnnouncementService(announcementId);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Delete announcement error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
    });
  }
};
