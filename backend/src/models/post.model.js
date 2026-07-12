import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const postSchema = new Schema(
    {
        content: {
            type: String,
            trim: true
        },
        attachments: [
            {
                url: String,      //cloudinary url
                fileType: String  //image, video, raw
            }
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        ownerClass: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        likesCount: {
            type: Number,
            default: 0
        },
        commentsCount: {
            type: Number, 
            default: 0
        }
    },
    {timestamps: true}
);

postSchema.plugin(mongooseAggregatePaginate);
postSchema.index({ ownerClass: 1, createdAt: -1 });
export const Post = mongoose.model("Post", postSchema);