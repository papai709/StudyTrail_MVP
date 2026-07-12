import mongoose, { isValidObjectId } from "mongoose"; 
import { Goal } from "../models/goal.model.js";
import { Post } from "../models/post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Gamification } from "../models/gamification.model.js";

// safely calculates midnight IST without parsing localized strings
const getMidnightIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;     // 5 hours 30 mins in milliseconds
    const istDate = new Date(now.getTime() + istOffset);
    istDate.setUTCHours(0, 0, 0, 0);
    return new Date(istDate.getTime() - istOffset);   // return actual date object for IST midnight
};


const createGoal = asyncHandler(async(req, res)=>{
    const {title, subject, deadline, visibility} = req.body;

    if(!title || !subject || !deadline){
        throw new ApiError(400, "Title, subject, and deadline are required");
    }

    const goal = await Goal.create({
        user: req.user._id,
        title,
        subject,
        deadline,
        visibility: visibility || "public"
    });

    if(!goal){
        throw new ApiError(400, "Something went wrong while creating the goal");
    }

    if(goal.visibility === 'public'){
        // ownerClass must always come from the authenticated user, never from the client body
        if (!req.user?.className) {
            throw new ApiError(400, "Complete your profile by adding your class before sharing goals publicly");
        }

        await Post.create({
            content: `Just set a new goal : ${goal.title}`,
            owner: req.user._id,
            ownerClass: req.user.className,
        });
    }
    return res
    .status(200)
    .json(new ApiResponse(200, goal, "Goal created successfully"));
});

const updateGoal = asyncHandler(async (req, res) => {
    const { goalId } = req.params;
    const { title, subject, deadline, status, visibility } = req.body;

    if (!isValidObjectId(goalId)) {
        throw new ApiError(400, "Invalid goal ID");
    }

    const goal = await Goal.findById(goalId);
    if (!goal) throw new ApiError(404, "Goal not found");
    
    if (goal.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to update this goal");
    }

    const previousStatus = goal.status;

    // Rewards can only ever be claimed once per goal. If the goal already claimed its
    // reward (rewardClaimed === true), OR the incoming status isn't 'completed', this is
    // just a plain, non-transactional field update — no XP/streak logic involved.
    const isFreshCompletion = status === 'completed' && !goal.rewardClaimed;

    if (!isFreshCompletion) {
        const updatedGoal = await Goal.findByIdAndUpdate(
            goalId,
            {
                $set: { title, subject, deadline, status, visibility }
            },
            { new: true, runValidators: true }
        );

        return res
            .status(200)
            .json(new ApiResponse(200, updatedGoal, "Goal updated successfully"));
    }

    // 3 hour timestamp check
    const hoursSinceCreation = (Date.now() - goal.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation < 3) {
        throw new ApiError(400, "You must spend at least 3 hours on this goal before marking it as completed.");
    }

    const userStats = await Gamification.findOne({ user: req.user._id });
    const today = getMidnightIST();

    let lastActivity = null;
    if (userStats?.lastActivityDate) {
        const prevOffset = 5.5 * 60 * 60 * 1000;
        const prevIstDate = new Date(userStats.lastActivityDate.getTime() + prevOffset);
        prevIstDate.setUTCHours(0, 0, 0, 0);
        lastActivity = new Date(prevIstDate.getTime() - prevOffset);
    }

    let goalsToday = userStats?.goalsCompletedToday || 0;

    if (lastActivity && lastActivity.getTime() === today.getTime()) {
        if (goalsToday >= 2) {
            throw new ApiError(400, "You have already completed the maximum of 2 goals for today.");
        }
        goalsToday += 1;
    } else {
        goalsToday = 1; 
    }

    let newStreak = userStats?.currentStreak || 0;
    let newLongestStreak = userStats?.longestStreak || 0;

    if (lastActivity) {
        const diffTime = Math.abs(today - lastActivity);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) newStreak += 1; 
        else if (diffDays > 1) newStreak = 1; 
    } else {
        newStreak = 1; 
    }

    if (newStreak > newLongestStreak) newLongestStreak = newStreak;

    // ownerClass must always come from the authenticated user, never from the client body
    if (goal.visibility === 'public' && !req.user?.className) {
        throw new ApiError(400, "Complete your profile by adding your class before sharing goals publicly");
    }

    // MONGODB SESSION TRANSACTION 
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // A. Update Gamification (Pass { session })
        await Gamification.findOneAndUpdate(
            { user: req.user._id },
            {
                $set: {
                    xp: (userStats?.xp || 0) + 50,
                    currentStreak: newStreak,
                    longestStreak: newLongestStreak,
                    lastActivityDate: new Date(),
                    goalsCompletedToday: goalsToday
                }
            },
            { new: true, upsert: true, session }
        );

        // B. Update Goal (Pass { session }) — mark rewardClaimed so it can never be re-awarded
        const updatedGoal = await Goal.findByIdAndUpdate(
            goalId,
            {
                $set: { title, subject, deadline, status, visibility, rewardClaimed: true }
            },
            { new: true, runValidators: true, session }
        );

        // C. Create Post (Pass { session }, note the array syntax)
        if (updatedGoal.visibility === 'public') {
            await Post.create(
                [{
                    content: `Just completed my study goal: ${updatedGoal.title}`,
                    owner: req.user._id,
                    ownerClass: req.user.className
                }], 
                { session }
            );
        }

        // D. Commit all operations
        await session.commitTransaction();
        session.endSession();

        return res
        .status(200)
        .json(new ApiResponse(200, updatedGoal, "Goal completed and rewards claimed successfully!"));

    } catch (error) {
        // Abort all operations if anything fails
        await session.abortTransaction();
        session.endSession();

        throw new ApiError(500, error?.message || "Failed to process goal completion. Transaction aborted.");
    }

});

const deleteGoal = asyncHandler(async(req, res)=>{
    const { goalId } = req.params;

    if (!isValidObjectId(goalId)) {
        throw new ApiError(400, "Invalid goal ID");
    }

    const goal = await Goal.findById(goalId);

    if (!goal) {
        throw new ApiError(404, "Goal not found");
    }

    if (goal.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to delete this goal");
    }

    await Goal.findByIdAndDelete(goalId);
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Goal deleted successfully"));
});

const getGoalById = asyncHandler(async(req, res)=>{
    const { goalId } = req.params;

    if (!isValidObjectId(goalId)) {
        throw new ApiError(400, "Invalid goal ID");
    }

    const goal = await Goal.findById(goalId);

    if (!goal) {
        throw new ApiError(404, "Goal not found");
    }

    if (goal.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to access this goal");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, goal, "Goal fetched successfully"));
});

const getGoals = asyncHandler(async(req, res)=>{
    const { status } = req.query;
    
    const query = { user: req.user._id };

    if (status) {
        query.status = status;
    }

    const goals = await Goal.find(query).sort({ deadline: 1 });

    return res
    .status(200)
    .json(new ApiResponse(200, goals, "Goals fetched successfully"));
});


export {
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalById,
    getGoals
}
