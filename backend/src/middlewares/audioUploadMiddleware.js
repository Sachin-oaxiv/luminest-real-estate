
import multer from "multer";

const allowedMimeTypes = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
]);

const upload = multer({
  storage: multer.memoryStorage(),

  fileFilter: (_req, file, callback) => {
    // Remove codec parameters, e.g. ";codecs=opus"
    const baseMimeType = file.mimetype
      .split(";")[0]
      .trim()
      .toLowerCase();

    if (!allowedMimeTypes.has(baseMimeType)) {
      return callback(
        new Error(
          "Unsupported audio format. Use WebM, OGG, MP4 or MP3 audio."
        )
      );
    }

    callback(null, true);
  },

  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 1,
  },
});

export default upload;
