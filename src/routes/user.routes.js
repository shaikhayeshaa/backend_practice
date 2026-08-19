import { Router } from "express";
import {
    logout,
    registerUser,
    refreshAccessToken,
    loginUser,
    changeUserPassword,
    getCurrentUser,
    updateUserInfo,
    updateUserAvatar,
    updateUserCover,
    getUserChannelProfile,
    getUserWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)
router.route("/login").post(
    loginUser

)

// Secured Routes
router.route("/logout").post(
    verifyJwt,
    logout
)
router.route("/refreshToken").post(
    refreshAccessToken
)
router.route("/changeUserPassword").post(
    verifyJwt,
    changeUserPassword
)
router.route("/currentUser").get(
    verifyJwt,
    getCurrentUser
)
router.route("/updateUserInfo").patch(
    verifyJwt,
    updateUserInfo
)
router.route("/updateAvatar").patch(
    verifyJwt,
    upload.single("avatar"),
    updateUserAvatar
)
router.route("/updateCover").patch(
    verifyJwt,
    upload.single("cover"),
    updateUserCover
)

router.route("/channel/:username").get(
    verifyJwt,
    getUserChannelProfile,
)
router.route("/watchHistory").get(
    verifyJwt,
    getUserWatchHistory
)

export default router