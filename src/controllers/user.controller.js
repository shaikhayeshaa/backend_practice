import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js";
import { User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary_service.js";
import { ApiResponse } from "../utils/api_response.js";


const generateRefreshAndAccessToken = async(userId) => {
    try {
        // finding user from database using id
        const user = await User.findById(userId)
        // generating tokens for that user
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()

        // updating user in database
        user.refreshToken = refreshToken
        // saving user without validation
        await user.save({validateBeforeSave: false})
        return {refreshToken, accessToken}
        
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Error generating tokens",)
        
    }
}

const registerUser = asyncHandler(async (req, res) => {
    
    // created request body
    const {fullName, email, username, password } = req.body

    //print in console
    console.log(`fullName: ${fullName}, email: ${email}, username: ${username}, password: ${password}`);

    // validation for empty fields
    if ([fullName , email , username , password].some((val) => val?.trim() === "")){ {
        throw new ApiError(400, "All fields are required");   
    }}

    // validation for password
    if(password.length < 6){
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
    const existedUser =  await  User.findOne({ $or: [{ email }, { username }] })  
        
    if (existedUser) {
            throw new ApiError(409, "User having same email or username already exists");
        }
    
    // upload files locally 
   const avatarLocalPath =  req.files?.avatar[0]?.path;
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
        new ApiResponse(200, "User registered Successfully" , createdUser)
    )


});

const loginUser = asyncHandler(async (req, res) => {

    // getting data from user through api body
    const {username, email , password} = req.body;

    if(!username || !email){
        throw new ApiError(400, "Email or username is required");
    }

    const user = await User.findOne({ $or: [{ email }, { username }] })

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Password is incorrect");
    }

    const {refreshToken, accessToken} = await generateRefreshAndAccessToken(user._id)

    return res.status(200).json(
        new ApiResponse(200, "User logged in Successfully" , {refreshToken, accessToken})
    )

});


export { registerUser , loginUser };