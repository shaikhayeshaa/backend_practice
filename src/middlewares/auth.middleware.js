import { ApiError } from "../utils/api_error.js";
import { asyncHandler } from "../utils/async_handler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";


const verifyJwt = asyncHandler(
    async (req, res, next) => {
        try {
            const token = req.cookies?.accessToken || req.header(
                "Authorization"
            )?.replace("Bearer ", "");
            console.log( 'token', token);

            if(!token) throw new ApiError(401, "Unauthorized Request");
          
            console.log('secret' ,process.env.ACCESS_TOKEN_SECRET)
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // may be need to add await
            console.log('decoded', decoded);
            
            if(!decoded) throw new ApiError(401, "Invalid Access token");

            const user = await User.findById(decoded._id).select("-password -refreshToken");
            console.log('user', user);

            if(!user) throw new ApiError(401, "Invalid Access token");

            req.user = user;
            next(); 
            
        } catch (error) {
            throw new ApiError(401, "Invalid token");
        }
    }
);


export { verifyJwt }