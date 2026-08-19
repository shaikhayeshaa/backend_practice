import { v2 as cloudinary } from "cloudinary"
import fs from "fs"


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;

    try {
        return await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
    } catch (error) {
        console.error("Cloudinary upload failed:", error.message);
        return null;
    } finally {
        try {
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
        } catch (error) {
            console.error("Temporary file cleanup failed:", error.message);
        }
    }
};


export { uploadOnCloudinary }