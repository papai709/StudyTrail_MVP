import mongoose, { isValidObjectId } from "mongoose";
import { Bookmark } from "../models/bookmark.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// toggle save/unsave a post
const toggleBookmark = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }

    // Check if the bookmark already exists
    const existingBookmark = await Bookmark.findOne({
        post: postId,
        savedBy: req.user._id
    });

    if (existingBookmark) {
        // If it exists, unsave it by deleting the document
        await Bookmark.findByIdAndDelete(existingBookmark._id);
        
        return res
        .status(200)
        .json(new ApiResponse(200, { isSaved: false }, "Post removed from bookmarks"));
    }

    // If it does not exist, create a new bookmark
    await Bookmark.create({
        post: postId,
        savedBy: req.user._id
    });

    return res
    .status(200)
    .json(new ApiResponse(200, { isSaved: true }, "Post saved to bookmarks"));
});


//  get all bookmarked posts for the logged-in user
const getBookmarkedPosts = asyncHandler(async (req, res) => {
    const bookmarks = await Bookmark.find({ savedBy: req.user._id })
        .sort({ createdAt: -1 })
        .populate({
            path: "post",
            populate: {
                path: "owner",
                select: "fullName username profileImage"
            }
        });

    // Extract just the posts from the bookmark documents for a cleaner frontend response
    const savedPosts = bookmarks.map(bookmark => bookmark.post).filter(post => post !== null);

    return res
    .status(200)
    .json(new ApiResponse(200, savedPosts, "Bookmarked posts fetched successfully"));
});

export {
    toggleBookmark,
    getBookmarkedPosts
};
