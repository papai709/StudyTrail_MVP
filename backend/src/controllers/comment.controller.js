import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Post } from "../models/post.model.js";

const addComment = asyncHandler(async(req, res)=>{
    const {postId} = req.params;
    const {content} = req.body;

    if(!isValidObjectId(postId)){
        throw new ApiError(400, "Invalid post ID");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.create({
        content,
        post: postId,
        commentby: req.user._id 
    });

    if (!comment) {
        throw new ApiError(500, "Failed to add comment");
    }

    // Populate the user details before returning
    const populatedComment = await Comment.findById(comment._id).populate("commentby", "fullName username profileImage");

    // increase the number of comments on the post.
    await Post.findByIdAndUpdate(postId ,{ $inc: { commentsCount: 1 } });
    
    return res
        .status(201)
        .json(new ApiResponse(201, populatedComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async(req, res)=>{
    const {commentId} = req.params;
    const {content} = req.body;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment-ID");
    }
    
    if(!content || content.trim() === ""){
        throw new ApiError(400, "Comment content is required to update a comment");
    }
    
    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400, "Comment not found");
    }

    if(comment.commentby.toString() !== req.user._id.toString()){
        throw new ApiError(400, "You don't have permission to edit this comment");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{content}
        },
        {new: true}
    );

    return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));

});

const deleteComment = asyncHandler(async(req, res)=>{
    const {commentId} = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400, "Comment not found");
    }

    if(comment.commentby.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You do not have permission to delete this comment");
    }

    // store the post ID before delete the comment 
    const postId = comment.post;

    await Comment.findByIdAndDelete(commentId);

    // decrease the number of comments on the post.
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1} });

    return res
    .status(200)
    .json(new ApiResponse(200,{}, "Comment deleted successfully"));
});

const getPostComments = asyncHandler(async(req, res) => {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }

    // fetch the comments and populate the user's details
    const comments = await Comment.find({ post: postId })
        .populate("commentby", "fullName username profileImage") 
        .sort({ createdAt: -1 }) 

    // Get the total count of comments for the frontend to calculate total pages
    const totalComments = await Comment.countDocuments({ post: postId });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                { comments, totalComments }, 
                "Comments fetched successfully"
            )
        );
});

export {
    addComment,
    updateComment,
    deleteComment,
    getPostComments,
}