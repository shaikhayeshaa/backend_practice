import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/api_error.js"
import { ApiResponse } from "../utils/api_response.js"
import { asyncHandler } from "../utils/async_handler.js"
import { uploadOnCloudinary } from "../utils/cloudinary_service.js"


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoLocalPath) {
        throw new ApiError(400, "Video is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const uploadedVideo = await uploadOnCloudinary(videoLocalPath)
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!uploadedVideo) {
        throw new ApiError(500, "Video upload failed")
    }

    if (!uploadedThumbnail) {
        throw new ApiError(500, "Thumbnail upload failed")
    }

    const createdVideo = await Video.create({
        videoFile: uploadedVideo.secure_url || uploadedVideo.url,
        thumbnail: uploadedThumbnail.secure_url || uploadedThumbnail.url,
        title: title.trim(),
        description: description.trim(),
        duration: uploadedVideo.duration,
        owner: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, "Video Uploaded Successfully", createdVideo)
    )
})
