
import {
  getAllMedia as getAllMediaService,
} from "./media.service.js";

export const getAllMedia = async (req, res) => {
  try {
    const {
      search,
      evidenceType,
      uploadedBy,
      dateFrom,
      dateTo,
      page,
      limit,
    } = req.query;

    if (dateFrom && Number.isNaN(new Date(dateFrom).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date",
      });
    }

    if (dateTo && Number.isNaN(new Date(dateTo).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date",
      });
    }

    if (
      dateFrom &&
      dateTo &&
      new Date(dateFrom) > new Date(dateTo)
    ) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date",
      });
    }

    // Include audio_recording in supported evidence types.
    const allowedTypes = [
      "property_photo",
      "customer_photo",
      "document",
      "other",
      "audio_recording",
    ];

    if (
      evidenceType &&
      !allowedTypes.includes(evidenceType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid evidence type",
      });
    }

    const result = await getAllMediaService({
      search,
      evidenceType,
      uploadedBy,
      dateFrom,
      dateTo,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      count: result.media.length,
      pagination: result.pagination,
      media: result.media,
    });
  } catch (error) {
    console.error("Get all media error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve media files",
    });
  }
};
