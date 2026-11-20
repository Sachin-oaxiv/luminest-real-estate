
import cloudinary from "../config/cloudinary.js";

const uploadToCloudinary = (fileBuffer, folder = "real-estate/visit-evidence", resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          publicId: result.public_id,
          fileUrl: result.secure_url,
          resourceType: result.resource_type,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) {
    throw new Error("Cloudinary public ID is required");
  }

  return await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
};

export default uploadToCloudinary;
