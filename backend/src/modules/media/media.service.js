import VisitEvidence from "../../models/VisitEvidence.js";

export const getAllMedia = async (filters = {}) => {
  const {
    search = "",
    evidenceType = "",
    uploadedBy = "",
    dateFrom = "",
    dateTo = "",
    page = 1,
    limit = 12,
  } = filters;

  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 12));

  const query = {};

  if (search.trim()) {
    const safeSearch = search.trim().replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    query.$or = [
      { fileName: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } },
    ];
  }

  if (evidenceType) {
    query.evidenceType = evidenceType;
  }

  if (uploadedBy) {
    query.uploadedBy = uploadedBy;
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};

    if (dateFrom) {
      query.createdAt.$gte = new Date(dateFrom);
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDate;
    }
  }

  const [media, total] = await Promise.all([
    VisitEvidence.find(query)
      .populate({
        path: "visit",
        select: "propertyName propertyAddress scheduledDate status customer assignedTo",
        populate: [
          {
            path: "customer",
            select: "name phone email",
          },
          {
            path: "assignedTo",
            select: "name email role",
          },
        ],
      })
      .populate("uploadedBy", "name email role")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean(),

    VisitEvidence.countDocuments(query),
  ]);

  return {
    media,
    pagination: {
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};