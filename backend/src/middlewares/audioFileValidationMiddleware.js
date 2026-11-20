
import { fileTypeFromBuffer } from "file-type";

const allowedDetectedTypes = new Set([
  "video/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
]);

const audioFileValidationMiddleware = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio recording file is required.",
      });
    }

    const declaredMimeType = req.file.mimetype
      .split(";")[0]
      .trim()
      .toLowerCase();

    const detected = await fileTypeFromBuffer(req.file.buffer);

    if (!detected || !allowedDetectedTypes.has(detected.mime)) {
      return res.status(400).json({
        success: false,
        message: "Audio file content could not be verified.",
      });
    }

    // WebM audio recorded by browsers is detected as video/webm
    // because WebM is a media container format.
    const validWebm =
      declaredMimeType === "audio/webm" &&
      detected.mime === "video/webm";

    // Other formats must match their detected MIME type.
    const validOther =
      declaredMimeType !== "audio/webm" &&
      detected.mime === declaredMimeType;

    if (!validWebm && !validOther) {
      return res.status(400).json({
        success: false,
        message: "Audio file content does not match its declared format.",
      });
    }

    // Store the normalized MIME type without codec parameters.
    req.file.detectedMimeType = declaredMimeType;

    next();
  } catch (error) {
    console.error("Audio validation error:", error);

    return res.status(400).json({
      success: false,
      message: "Unable to validate audio recording.",
    });
  }
};

export default audioFileValidationMiddleware;
