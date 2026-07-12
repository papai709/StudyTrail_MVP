import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { Connection } from "../models/connection.model.js";

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
};

const registerUser = asyncHandler( async (req, res) => {


    const {fullName, email, username, password } = req.body

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const user = await User.create({
        fullName,
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} );

const loginUser = asyncHandler(async (req, res) =>{

    const {email, username, password} = req.body
    

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

});

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }
    
        const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

});

const getCurrentUser = asyncHandler(async (req, res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
});

const completeUserProfile = asyncHandler(async (req, res) => {
    const { schoolName, className, bio, profileImage, coverImage, board, city, state } = req.body;

    if (!schoolName || !className) {
        throw new ApiError(400, "School Name and Class Name are required");
    }

     
    const updateData = {
        schoolName,
        className,
    };
    
    if (bio) updateData.bio = bio;
    if (board) updateData.board = board;

    //handle location fields
    if(city || state){
        updateData.location = {};
        if(city) updateData.location.city = city.toLowerCase();
        if (state) updateData.location.state = state.toLowerCase();
    }

    //profile-image
    if(profileImage){
        updateData.profileImage = profileImage;    
    }
    const profileImageLocalPath = req.files?.profileImage?.[0]?.path;
    
    if (profileImageLocalPath) {
        const profileImage = await uploadOnCloudinary(profileImageLocalPath);
        if (!profileImage?.url) {
            throw new ApiError(500, "Error while uploading profile image to Cloudinary");
        }
        updateData.profileImage = profileImage.url;
    }

    //cover-image
    if(coverImage){
        updateData.coverImage = coverImage;
    }
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (coverImageLocalPath) {
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);
        if (!coverImage?.url) {
            throw new ApiError(500, "Error while uploading cover image to Cloudinary");
        }
        updateData.coverImage = coverImage.url;
    }
        
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: updateData
        },
        { new: true } 
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(500, "Failed to update user profile");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Profile completed successfully")
    );
});

const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullName, email, schoolName, className, bio, board, city, state} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "fullname and email is required")
    }

    const updateData = {
        fullName,
        email,
        bio: bio || "",
        schoolName: schoolName || "",
        className: className || "",
        board: board || ""
    };
    
    if (city) updateData["location.city"] = city.toLowerCase();
    if (state) updateData["location.state"] = state.toLowerCase();

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: updateData
        },
        {new: true, runValidators: true}
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, user, "Account detailes update successfully")
    );
});

const updateUserProfileImage = asyncHandler(async(req, res)=>{
    const profileImageLocalPath = req.file?.path
    if(!profileImageLocalPath){
        throw new ApiError(400, "Profile image is missing")
    }

    const profileImage = await uploadOnCloudinary(profileImageLocalPath)

    if(!profileImage.url){
        throw new ApiError(400, "Error while uploading image to Cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                profileImage: profileImage.url
            }
        },
        {new : true}
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Profile Image updated successfully")
    )
});

const updateUserCoverImage = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading image to Cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image updated successfully")
    );
});

const getRecommendedUsers = asyncHandler(async (req, res) => {
    const currentUser = req.user;

    // 1. Only className is strictly required now
    if (!currentUser.className) {
        throw new ApiError(400, "Complete your class profile to get recommendations");
    }

    // fetch all existing connections for this user
    const existingConnections = await Connection.find({
        $or: [{ sender: currentUser._id }, { receiver: currentUser._id }]
    });

    // extract the IDs to exclude
    const excludedUserIds = existingConnections.map(conn => 
        conn.sender.toString() === currentUser._id.toString() ? conn.receiver : conn.sender
    );

    // add the current user's own ID to the exclusion list
    excludedUserIds.push(currentUser._id);


    // dynamically build the scoring logic
    const scoringConditions = [];

    // +3 points if they have a board and it matches
    if (currentUser.board) {
        scoringConditions.push({
            $cond: [{ $eq: ["$board", currentUser.board] }, 3, 0]
        });
    }

    // +2 points if they have a city and it matches
    if (currentUser.location?.city) {
        scoringConditions.push({
            $cond: [{ $eq: ["$location.city", currentUser.location.city] }, 2, 0]
        });
    }

    // +1 point if they have a state and it matches
    if (currentUser.location?.state) {
        scoringConditions.push({
            $cond: [{ $eq: ["$location.state", currentUser.location.state] }, 1, 0]
        });
    }

    // if they only provided a class, default the score to 0 so the $add operator doesn't crash
    if (scoringConditions.length === 0) {
        scoringConditions.push(0);
    }

    // execute the Aggregation Pipeline
    const recommendedUsers = await User.aggregate([
        // match only by Class (The bare minimum for academic relevance)
        {
            $match: {
                _id: { $nin: excludedUserIds }, // $nin (not in) filters out connected users
                className: currentUser.className
            }
        },
        // apply the dynamic scoring conditions
        {
            $addFields: {
                relevanceScore: {
                    $add: scoringConditions
                },
                randomSort: { $rand: {} }  // generate a random number for every user
            }
        },
        // sort by highest score first
        {
            $sort: { 
                relevanceScore: -1,
                randomSort: 1   // random tie-breaker
            }
        },
        // limit to 5 suggestions
        {
            $limit: 10
        },
        // Format the output
        {
            $project: {
                fullName: 1,
                username: 1,
                profileImage: 1,
                schoolName: 1,
                className: 1,
                board: 1,
                location: 1,
                bio: 1,
                relevanceScore: 1 
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200, recommendedUsers, "Recommendations fetched successfully"));
});

const getUserProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId)
        .select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, user, "Profile fetched successfully")
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    completeUserProfile,
    updateAccountDetails,
    updateUserProfileImage,
    updateUserCoverImage,
    getRecommendedUsers,
    getUserProfile
}