import mongoose, { Schema } from "mongoose";

const gamificationSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true 
        },
        xp: { 
            type: Number, 
            default: 0 
        },
        level: { 
            type: Number, 
            default: 1 
        },
        currentStreak: { 
            type: Number, 
            default: 0 
        },
        longestStreak: { 
            type: Number, 
            default: 0 
        },
        lastActivityDate: { 
            type: Date 
        },
        goalsCompletedToday: { 
            type: Number, 
            default: 0 
        }
    },
    { timestamps: true }
);

export const Gamification = mongoose.model("Gamification", gamificationSchema);