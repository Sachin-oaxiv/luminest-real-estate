
import { fileTypeFromBuffer } from "file-type";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const fileValidationMiddleware = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    const detectedType = await fileTypeFromBuffer(req.file.buffer);

    if (
      !detectedType ||
      !allowedMimeTypes.includes(detectedType.mime) ||
      detectedType.mime !== req.file.mimetype
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid file content or unsupported file type",
      });
    }

    req.file.detectedMimeType = detectedType.mime;

    next();
  } catch (error) {
    console.error("File validation error:", error);

    return res.status(400).json({
      success: false,
      message: "Unable to validate uploaded file",
    });
  }
};

export default fileValidationMiddleware;
