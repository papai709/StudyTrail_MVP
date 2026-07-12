import mongoose,{isValidObjectId} from "mongoose";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Connection } from "../models/connection.model.js";

//create post

const createAPost = asyncHandler(async(req, res)=>{
    const {content} = req.body;
    if ((!content || content.trim() === "") && (!req.files || req.files.length === 0)) {
        throw new ApiError(400, "Post must contain either text or an attachment");
    }

    const uploadedAttachments = [];

    //handle file uploading
    if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map(file => uploadOnCloudinary(file.path));
        const cloudinaryResponses = await Promise.all(uploadPromises);

        for (const response of cloudinaryResponses) {
            if (response) {
                uploadedAttachments.push({
                    url: response.url,
                    fileType: response.resource_type // Cloudinary returns 'image', 'video', or 'raw'
                });
            }
        }
    }

    const post = await Post.create({
        content: content || "",
        attachments: uploadedAttachments,
        owner: req.user._id,
        ownerClass: req.user.className
    });

    const createdPost = await Post.findById(post._id).populate("owner", "fullName username profileImage");

    return res
        .status(201)
        .json(new ApiResponse(201, createdPost, "Post create successfully"));

});

//get all post

const getAllPost = asyncHandler(async(req, res)=>{
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const currentUser = req.user;
    const userClass = currentUser?.className;

    if(!userClass){
        throw new ApiError(400, "Complete your profile by adding your class to view the feed");
    }

    // define freshness
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    // fetch existing connections (Your network)
    const existingConnections = await Connection.find({
        status: 'Accepted',
        $or: [{ sender: currentUser._id }, { receiver: currentUser._id }]
    });

    // extract connection IDs and add the logged-in user's ID (to prioritize their own posts too)
    const connectedUserIds = existingConnections.map(conn => 
        conn.sender.toString() === currentUser._id.toString() ? conn.receiver : conn.sender
    );

    const currentUserId = new mongoose.Types.ObjectId(currentUser._id);

    // dynamically build the Feed Score components to prevent injecting undefined variables
    const feedScoreComponents = [
        // connection boost (+30)
        { $cond: [{ $in: ["$owner._id", connectedUserIds] }, 30, 0] },

        // check freshness (+20 for <6h, +10 for <24h)
        { 
            $switch: {
                branches: [
                    { case: { $gte: ["$createdAt", sixHoursAgo] }, then: 20 },
                    { case: { $gte: ["$createdAt", twentyFourHoursAgo] }, then: 10 }
                ],
                default: 0
            }
        },
        // engagement metrics (1 point per like upto 10 points, 2 points per comment upto 20 points)
        { $min: [{ $ifNull: ["$likesCount", 0] }, 10] },
        { $min: [{ $multiply: [{ $ifNull: ["$commentsCount", 0] }, 2] }, 20] },
    ];

    // only add location/board points if the current user has them defined in their profile
    if (currentUser.board) {
        feedScoreComponents.push({ $cond: [{ $eq: ["$owner.board", currentUser.board] }, 15, 0] });
    }
    if (currentUser.location?.city) {
        feedScoreComponents.push({ $cond: [{ $eq: ["$owner.location.city", currentUser.location.city] }, 3, 0] });
    }
    if (currentUser.location?.state) {
        feedScoreComponents.push({ $cond: [{ $eq: ["$owner.location.state", currentUser.location.state] }, 2, 0] });
    }
    

    // execute the Aggregation Pipeline
    const postAggregateQuery = Post.aggregate([
        {
            // filter by class immediately for lightning-fast reads
            $match: { 
                ownerClass: userClass,
                owner: { $ne: currentUserId }   //drop owner posts
            }
        },
        {
            // join owner details early so we can score their location
            $lookup: {
                from: "users", 
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },
        {
            // calculate the dynamic feed score
            $addFields: {
                isPriorityConnection: { $in: ["$owner._id", connectedUserIds] },
                feedScore: { $add: feedScoreComponents },
                randomShuffle: { $rand: {} }  
            }
        },
        {
            // sort by highest feed score first, then by Newest for ties
            $sort: { 
                feedScore: -1,  
                createdAt: -1,
                
                randomShuffle: 1 
            }
        },
        {
            // check if the current user liked the post
            $lookup: {
                from: "likes",
                let: { postId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$post", "$$postId"] },
                                    { $eq: ["$likedBy", currentUserId] }
                                ]
                            }
                        }
                    },
                    { $limit: 1 } // stop searching once we find the user's like
                ],
                as: "userLike"
            }
        },
        {
            $addFields: {
                isLiked: { $gt: [{ $size: "$userLike" }, 0] }
            }
        },
        {
            // clean up the final output for the frontend
            $project: {
                content: 1,
                attachments: 1,
                createdAt: 1,
                updatedAt: 1,
                likesCount: 1,
                commentsCount: 1,
                isLiked: 1,
                feedScore: 1,            // helpful for frontend debugging or hiding 
                isPriorityConnection: 1, // frontend can use this to show a "Following" badge
                "owner._id": 1,
                "owner.fullName": 1,
                "owner.username": 1,
                "owner.profileImage": 1,
                "owner.schoolName": 1,
                "owner.className": 1
            }
        }
    ]);

    // paginate and Return
    const options = {
        page,
        limit
    };

    const paginatedResult = await Post.aggregatePaginate(postAggregateQuery, options);

    return res
    .status(200)
    .json(new ApiResponse(200, {
        posts: paginatedResult.docs,
        pagination: {
            currentPage: paginatedResult.page,
            totalPages: paginatedResult.totalPages,
            hasNextPage: paginatedResult.hasNextPage,
            totalPosts: paginatedResult.totalDocs
        }
    }, "Smart Feed fetched successfully"));
});

//get logged-in user's all posts

const getUserPosts = asyncHandler(async(req, res)=>{
    const posts = await Post
    .find({owner: req.user._id})
    .sort({createdAt: -1})
    .populate("owner", "fullName username profileImage");

    return res
    .status(200)
    .json(new ApiResponse(200, posts, "User posts fetched successfully"));
});

const updatePost = asyncHandler(async(req, res)=>{
    const { postId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required to update a post");
    }

    const post = await Post.findById(postId);

    if(!post){
        throw new ApiError(400, "Post not found");
    }

    if (post.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to edit this post");
    }

    const updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
            $set: { content }
        },
        { new: true }
    ).populate("owner", "fullName username profileImage");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPost, "Post updated successfully"));
});

const deletePost = asyncHandler(async(req, res)=>{
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }

    const post = await Post.findById(postId);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (post.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this post");
    }

    await Post.findByIdAndDelete(postId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Post deleted successfully"));
});

export {
    createAPost,
    getAllPost,
    getUserPosts,
    updatePost,
    deletePost
}
