import mongoose, { Schema } from "mongoose";

const goalSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    subject: {
      type: String,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public", // Public goals can be shared to the feed
    },
    rewardClaimed: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true },
);

export const Goal = mongoose.model("Goal", goalSchema);
