import mongoose from "mongoose";
import { Gamification } from "../models/gamification.model.js";
import { Connection } from "../models/connection.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// --- LEVEL CALCULATION UTILITY ---
const calculateLevelInfo = (totalXp) => {
    let level = 1;
    let xpNeededForNextLevel = level * 100;
    let xpRemaining = totalXp || 0;

    // Loop through levels subtracting required XP until we find the current level
    while (xpRemaining >= xpNeededForNextLevel) {
        xpRemaining -= xpNeededForNextLevel;
        level++;
        xpNeededForNextLevel = level * 100;
    }

    return {
        level,
        currentLevelXp: xpRemaining,
        xpNeededForNextLevel,
        progressPercentage: Math.floor((xpRemaining / xpNeededForNextLevel) * 100)
    };
};

// converts any Date into "midnight IST" for that date, so day-boundaries are
// compared consistently regardless of server timezone
const toMidnightIST = (date) => {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);
    istDate.setUTCHours(0, 0, 0, 0);
    return new Date(istDate.getTime() - istOffset);
};

// --- STREAK DISPLAY UTILITY ---
// The DB only updates currentStreak when a goal is completed.
// This function lazily computes what the streak SHOULD look like right now, for display
// purposes only   it does not write anything back to the database.
const getDisplayStreak = (storedStreak, lastActivityDate) => {
    if (!lastActivityDate) return 0;

    const today = toMidnightIST(new Date());
    const lastActivityIST = toMidnightIST(lastActivityDate);

    const diffDays = Math.round((today - lastActivityIST) / (1000 * 60 * 60 * 24));

    // diffDays === 0 -> completed a goal today, streak is current, show as-is
    // diffDays === 1 -> completed a goal yesterday, streak is still "alive" (not broken yet)
    // diffDays  > 1  -> at least one full day was missed, streak is broken
    if (diffDays > 1) return 0;

    return storedStreak || 0;
};

const getMyStats = asyncHandler(async (req, res) => {
    const stats = await Gamification.findOneAndUpdate(
        { user: req.user._id },
        { $setOnInsert: { user: req.user._id } },
        { new: true, upsert: true }
    );

    const levelData = calculateLevelInfo(stats.xp);
    const displayStreak = getDisplayStreak(stats.currentStreak, stats.lastActivityDate);

    const responseData = {
        ...stats.toObject(),
        currentStreak: displayStreak, // overwrite stale DB value with the lazily-computed one
        levelInfo: levelData
    };

    return res
        .status(200)
        .json(new ApiResponse(200, responseData, "Gamification stats fetched successfully"));
});

const getLeaderboard = asyncHandler(async (req, res) => {
    const userClass = req.user?.className;

    if (!userClass) {
        throw new ApiError(400, "Complete your profile by adding your class to view the leaderboard");
    }

    const leaderboard = await Gamification.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        { $unwind: "$userDetails" },
        {
            $match: {
                "userDetails.className": userClass
            }
        },
        {
            $sort: { xp: -1, _id: -1 } 
        },
        {
            $limit: 10 
        },
        {
            $project: {
                xp: 1,
                currentStreak: 1,
                longestStreak: 1,
                lastActivityDate: 1,
                "userDetails._id": 1,
                "userDetails.fullName": 1,
                "userDetails.username": 1,
                "userDetails.profileImage": 1
            }
        }
    ]);

    // Apply the level calculation AND the lazy streak-display fix to every student on the leaderboard
    const leaderboardWithLevels = leaderboard.map(student => {
        return {
            ...student,
            currentStreak: getDisplayStreak(student.currentStreak, student.lastActivityDate),
            levelInfo: calculateLevelInfo(student.xp)
        };
    });

    return res
        .status(200)
        .json(new ApiResponse(200, leaderboardWithLevels, "Leaderboard fetched successfully"));
});

const getNetworkStreaks = asyncHandler(async (req, res) => {
    const currentUser = req.user;

    // 1. Fetch existing accepted connections
    const existingConnections = await Connection.find({
        status: 'Accepted',
        $or: [{ sender: currentUser._id }, { receiver: currentUser._id }]
    });

    // 2. Extract the user IDs of the connections
    const connectedUserIds = existingConnections.map(conn => 
        conn.sender.toString() === currentUser._id.toString() ? conn.receiver : conn.sender
    );

    if (connectedUserIds.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No connections found"));
    }

    // 3. Aggregate gamification stats for these connections
    const networkStats = await Gamification.aggregate([
        {
            $match: { user: { $in: connectedUserIds } }
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        { $unwind: "$userDetails" },
        {
            $project: {
                currentStreak: 1,
                lastActivityDate: 1,
                "userDetails._id": 1,
                "userDetails.username": 1,
                "userDetails.profileImage": 1,
                "userDetails.fullName": 1
            }
        }
    ]);

    // 4. Calculate real-time display streak, filter, sort, and LIMIT to top 20
    const activeStreaks = networkStats.map(stat => {
        return {
            user: stat.userDetails,
            streak: getDisplayStreak(stat.currentStreak, stat.lastActivityDate) 
        };
    })
    .filter(stat => stat.streak > 0) // Remove users with 0 streak
    .sort((a, b) => b.streak - a.streak) // Sort highest streaks first
    .slice(0, 20); // LIMIT TO TOP 20 HERE

    return res
        .status(200)
        .json(new ApiResponse(200, activeStreaks, "Top network streaks fetched successfully"));
});

export {
    getMyStats,
    getLeaderboard,
    getNetworkStreaks
};