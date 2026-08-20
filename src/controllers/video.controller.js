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

const getAllVideos = asyncHandler(async (req, res) => {
    // Query parameters ke defaults set karo
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    // Pagination values ko numbers mein convert karo
    const pageNumber = Number.parseInt(page, 10)
    const limitNumber = Number.parseInt(limit, 10)

    // Page aur limit ki validation
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
        throw new ApiError(400, "Page must be a positive integer")
    }

    if (!Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        throw new ApiError(400, "Limit must be between 1 and 100")
    }

    // Agar userId diya gaya hai to woh valid MongoDB ObjectId hona chahiye
    if (userId && !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }

    // Public listing mein sirf published videos return karo
    const matchStage = {
        isPublished: true
    }

    // Kisi specific user ki videos filter karo
    if (userId) {
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }

    // Search query ko regex special characters se escape karke
    // title aur description dono mein case-insensitive search karo
    if (query?.trim()) {
        const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        matchStage.$or = [
            { title: { $regex: escapedQuery, $options: "i" } },
            { description: { $regex: escapedQuery, $options: "i" } }
        ]
    }

    // Sirf approved fields par sorting allow karo
    const allowedSortFields = ["createdAt", "updatedAt", "title", "views", "duration"]
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt"
    const sortDirection = sortType?.toLowerCase() === "asc" ? 1 : -1

    const videoAggregate = Video.aggregate([
        // Upar banaye gaye filters apply karo
        { $match: matchStage },

        // User collection se video owner ki details hasil karo
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },

        // Owner array ko single object mein convert karo
        {
            $unwind: {
                path: "$owner",
                preserveNullAndEmptyArrays: true
            }
        },

        // Response mein sirf required video aur public owner fields rakho
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.fullName": 1,
                "owner.avatar": 1
            }
        },

        // Requested field par sort karo; default newest videos first hain
        { $sort: { [sortField]: sortDirection, _id: -1 } }
    ])

    // Aggregation result par pagination apply karo
    const videos = await Video.aggregatePaginate(videoAggregate, {
        page: pageNumber,
        limit: limitNumber
    })

    // Paginated videos aur pagination metadata client ko return karo
    return res.status(200).json(
        new ApiResponse(200, "Videos fetched successfully", videos)
    )
})


export {
    publishAVideo,
    getAllVideos,
}
