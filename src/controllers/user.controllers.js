import {asyncHandler} from "../utilis/asyncHandler.js";
import {ApiError} from "../utilis/ApiError.js";
import {ApiResponse} from "../utilis/ApiResponse.js";
import { User } from "../models/user.model.js";

const generateAccessAndRefereshTokens = async(userId) =>{

    try {

        console.log("ACCESS_TOKEN_SECRET:", process.env.ACCESS_TOKEN_SECRET);
        console.log("REFRESH_TOKEN_SECRET:", process.env.REFRESH_TOKEN_SECRET);
        
        const user= await User.findById(userId)
        console.log(user);
        const accessToken = user.generateAccessToken()
        console.log(accessToken);
        const refreshToken = user.generateRefreshToken()
        console.log(refreshToken);

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registeruser=asyncHandler(async(req,res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const{fullName,email,password}=req.body;


    if(!fullName){
        throw new ApiError(400,"fullName is required");
        
    }

    if (!email) {
  throw new ApiError(400, "email is required");
}
    
   
    if(!password){
        throw new ApiError(400,"password is required");
        
    }


    

    const existedUser = await User.findOne({email})

     if (existedUser) {
        throw new ApiError(409, "User with name or phone already exists")
    }

    
    
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

const loginuser=asyncHandler(async(req,res)=>{
    const {email,password}=req.body;
    if (!email ) {
  throw new ApiError(400, "Username required");
    }

    if(!password){
        throw new ApiError(400,"password required");
    }

     const user = await User.findOne({email });
       
       if (!user) {
      throw new ApiError(404, "user not found");
       }

        const isPasswordValid = await user.isPasswordCorrect(password);
        console.log("ispassword is ",isPasswordValid);

      if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password");
          }
            const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id);

       const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    );



});




export {registeruser}
export {loginuser};