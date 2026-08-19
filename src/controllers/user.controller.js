import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js";
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary_service.js";
import { ApiResponse } from "../utils/api_response.js";
import mongoose from "mongoose";


const generateRefreshAndAccessToken = async (userId) => {
    try {
        // finding user from database using id
        const user = await User.findById(userId)
        // generating tokens for that user
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()

        // updating user in database
        user.refreshToken = refreshToken
        // saving user without validation
        await user.save({ validateBeforeSave: false })
        return { refreshToken, accessToken }

    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Error generating tokens",)

    }
}

const registerUser = asyncHandler(async (req, res) => {

    // created request body
    const { fullName, email, username, password } = req.body

    //print in console
    console.log(`fullName: ${fullName}, email: ${email}, username: ${username}, password: ${password}`);

    // validation for empty fields
    if ([fullName, email, username, password].some((val) => val?.trim() === "")) {
        {
            throw new ApiError(400, "All fields are required");
        }
    }

    // validation for password
    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters");
    }
    // validation for email
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ApiError(400, "Invalid email format");
        }
    }
    // check in database that user already exists having same email or username
    const existedUser = await User.findOne({ $or: [{ email }, { username }] })

    if (existedUser) {
        throw new ApiError(409, "User having same email or username already exists");
    }

    // upload files locally 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload files on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverLocalPath)


    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // create user in database
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // get user from database and remove password and refresh token
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, "User registered Successfully", createdUser)
    )


});

const loginUser = asyncHandler(async (req, res) => {

    // getting data from user through api body
    const { username, email, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "Email or username is required");
    }

    const user = await User.findOne({ $or: [{ email }, { username }] })

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Password is incorrect");
    }

    const { refreshToken, accessToken } = await generateRefreshAndAccessToken(user._id)

    const loggedInUser = User.findById(user._id).select("-password -refreshToken")

    // options for cookies
    const options = {
        httpOnly: true,
        secure: true,
    }


    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, "User logged in Successfully", { refreshToken, accessToken })
        )

});

const logout = asyncHandler(async (req, res) => {
    // we do not have user id to delete acceess token 
    // so we design a middle ware for this
    // unset removes field in mongoDB
    // set only empty the string
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, "User logged out Successfully")
        )
});

const refreshAccessToken = asyncHandler(async (req, res) => {

    // get refresh token
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    // 
    if (!incommingRefreshToken) {
        throw new ApiError(
            401, "Unauthorized request"
        )
    }
    try {
        // decode token
        const decoded = jwt.verify(incommingRefreshToken, process.env.ACCESS_TOKEN_SECRET);
        // find user from database
        const user = await User.findById(decoded?._id)
        // check if get user
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
        // check if tokens match
        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token in expired")
        }
        const options = {
            httpOnly: true,
            secure: true,
        }
        // generate new token
        const { refreshToken, accessToken } = await generateRefreshAndAccessToken(user?._id);
        // send response
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    "Refresh Token Generated Successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, "Invalid Refresh Token");
    }
});

const changeUserPassword = asyncHandler(async (req, res) => {
    // gets old and new pass from user
    const { oldPassword, newPassword } = req.body
    // check if oldPassword matches
    try {
        const user = User.findById(
            req.user._id
        )
        // check if password is correct
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if (!isPasswordCorrect) {
            throw new ApiError(
                401,
                "Incorrect Old Password"
            )
        }
        user.password = newPassword
        await user.save({ validateBeforeSave: false })

        return res.status(200).json(
            new ApiResponse(200, "Password Changed Successfully")
        )
    } catch (error) {
        throw new ApiError(401, "Changing Password Failed")

    }
})

const getCurrentUser = asyncHandler(async (req, res) => {
    try {
        if (!req.user) {
            throw new ApiError(
                401,
                "User not found"
            )
        }
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "User Found",
                    req.user
                )
            )

    } catch (error) {

    }

})

const updateUserInfo = asyncHandler(async (req, res) => {
    const { fullName, email, } = req.body

    if (!fullName || !email) {
        throw new ApiError(
            401,
            "All Fields are Required"
        )

    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { fullName, email }
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Updated Successfully",
                user
            )
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    try {

        const avatarLocalPath = req.file?.path
        if (!avatarLocalPath) {
            throw new ApiError(
                400,
                "Avatar file is missing"
            )
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (!avatar) {
            throw new ApiError(
                400,
                "Avatar file is missing"
            )
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: { avatar: avatar.url }
            },
            {
                new: true
            }
        ).select("-password")

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Updated Successfully",
                    user
                )
            )


    } catch (error) {
        throw new ApiError(
            401,
            "Updating avatar failed"
        )
    }
})

const updateUserCover = asyncHandler(async (req, res) => {
    try {

        const coverLocalPath = req.file?.path
        if (!coverLocalPath) {
            throw new ApiError(
                400,
                "Cover file is missing"
            )
        }

        const cover = await uploadOnCloudinary(coverLocalPath);
        if (!cover) {
            throw new ApiError(
                400,
                "Cover file is missing"
            )
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: { coverImage: cover.url }
            },
            {
                new: true
            }
        ).select("-password")

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Updated Successfully",
                    user
                )
            )


    } catch (error) {
        throw new ApiError(
            401,
            "Updating cover failed"
        )
    }
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username) {
        throw new ApiError(400, "username param is missing")
    }

    const channel = User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()   // will find one user
            }
        },
        // Yani user(alk channel) ko kis kis ne subscribe kiya hua hai.
        {
            $lookup: {
                from: "subscription",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            },
        },
        // user ne kin channels ko subscribe kiya hai?
        {
            $lookup: {
                from: "subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriberTo"

            },
        },
        // added these fields
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscriberTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "subscribers.subscriber"] },
                        then: true,
                        else: false,
                    }
                }

            },
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                cover: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])
    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist")
    }
    console.log(channel);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Channel Fetched Syuccessfully",
                channel[0],
            )
        )

})


const getUserWatchHistory = asyncHandler(async (req, res) => {
 try {
       const user = await User.aggregate(
        [
            {
                $match: {
                    _id: mongoose.Types.ObjectId(req.user._id)  // getting mongo db id.. 
                }
            },
            {
                $lookup: {
                    from: "video",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                 pipeline: [
                                    {
                                        $project:{
                                            fullName:1,
                                            username:1,
                                            avatar:1,
                                        }
                                    }
                                 ]
                            }
                        },
                        // lookup sa array milti hai us ma 0 item leni prti hai.. array ko khtm krdengy.
                        // field ka name owner likh dea tou owner array over right hojayegi.
                        {
                            $addFields:{
                                owner: {
                                    $first: "@owner"
                                }
                            }
                        }
                    ]
                }
            }

        ]
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "watch history fetched successfully",
            user[0].watchHistory,
        )
    )
 } catch (error) {
    throw new ApiError(
        404,
        "Failed to fetch Watch History",
    )
 }
})

export {
    registerUser,
    loginUser,
    logout,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    updateUserInfo,
    updateUserAvatar,
    updateUserCover,
    getUserChannelProfile,
    getUserWatchHistory
};