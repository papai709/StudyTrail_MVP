import mongoose, { Schema } from "mongoose";

const bookmarkSchema = new Schema(
    {
        post: {
            type: Schema.Types.ObjectId,
            ref: "Post",
            required: true
        },
        savedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

export const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
