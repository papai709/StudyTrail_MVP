import mongoose, {isValidObjectId} from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Post } from "../models/post.model.js";

const togglePostLike = asyncHandler(async (req, res)=>{
    const {postId} = req.params;

    if(!isValidObjectId(postId)){
        throw new ApiError(400, "Invalid post ID");
    };

    //check if the like already exists
    const existingLike = await Like.findOne({
        post: postId,
        likedBy: req.user._id
    });

    if(existingLike){
        //if esists, unlike it by deleting the document
        await Like.findByIdAndDelete(existingLike._id);

        // decrease the number of likes on the post.
        await Post.findByIdAndUpdate(postId, { $inc: {likesCount: -1 } });
        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked:false}, "Post unlike successfully"));
    };

    //if does not exists, create a new like
    await Like.create({
        post: postId,
        likedBy: req.user._id
    });

    // increase the number of likes on the post.
    await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });

    return res
    .status(200)
    .json(new ApiResponse(200, {isLiked:true},"Post liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res)=>{
    const {commentId} = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment ID")
    }

    //check if the like already exists
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    });

    if(existingLike){
        //if esists, unlike it by deleting the document
        await Like.findByIdAndDelete(existingLike._id);
        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked:false}, "Comment unliked successfully"));
    }

    //if does not exists, create a new like
    await Like.create({
        comment: commentId,
        likedBy: req.user._id
    });
    return res
    .status(200)
    .json(new ApiResponse(200, {isLiked:true}, "Comment liked successfully"));
});

export {
    togglePostLike,
    toggleCommentLike
}