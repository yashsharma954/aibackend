import {asyncHandler} from "../utilis/asyncHandler.js";
import {ApiError} from "../utilis/ApiError.js";
import {ApiResponse} from "../utilis/ApiResponse.js";
import { User } from "../models/user.model.js";

const registeruser=asyncHandler(async(req,res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const{fullName,email,password}=req.body;


    if(fullName==""){
        throw new ApiError(400,"fullName is required");
        
    }

    if (!email) {
  throw new ApiError(400, "email is required");
}
    
   
    if(password==""){
        throw new ApiError(400,"password is required");
        
    }


    

    const existedUser = await User.findOne({email})

     if (existedUser) {
        throw new ApiError(409, "User with name or phone already exists")
    }

    // let avatar;
    // const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // console.log("avatarLocalpath is ",avatarLocalPath);

    //    if (avatarLocalPath) {
    //       avatar = await uploadOnCloudinary(avatarLocalPath)
    //       console.log("avatar is ",avatar.url);
    //    }
   
    
     const user = await User.create({
        fullName,
        email,
        password
        
    })
//  jis bhi field ko hatana ho wo iss syntax se hata skta ha 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "Host registered Successfully")
    )

} )


export {registeruser}