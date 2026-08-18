import { Router } from "express";
import { logout, registerUser , refreshAccessToken , loginUser } from "../controllers/user.controller.js";
import { changeUserPassword , getCurrentUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
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
router.route("/user").post(
    verifyJwt,
    getCurrentUser
)

export default router