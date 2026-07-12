import mongoose,{isValidObjectId} from "mongoose";
import { Connection } from "../models/connection.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const sendConnectionRequest = asyncHandler(async(req, res)=>{
    const { receiverId } = req.params;
    const senderId = req.user._id;

    if(!isValidObjectId(receiverId)){
        throw new ApiError(400, "Invalid user ID");
    }

    if(senderId.toString() === receiverId.toString()){
        throw new ApiError(400, "You cannot send a connection request to yourself");
    }

    const receiver = await User.findById(receiverId).select("_id");
    if(!receiver){
        throw new ApiError(404, "User not found");
    }

    const existingConnection = await Connection.findOne({
        $or: [
            {
                sender: senderId, 
                receiver: receiverId,
            },
            {
                sender: receiverId,
                receiver: senderId,
            }
        ]
    });

    if(existingConnection){
        switch (existingConnection.status) {
            case "Pending":
                throw new ApiError(400, "A connection request is already pending between you two");
            case "Accepted":
                throw new ApiError(400, "You are already connected with this user");
            case "Rejected":
                existingConnection.status = "Pending";
                existingConnection.sender = senderId;
                existingConnection.receiver = receiverId;
                
                await existingConnection.save();
                return res
                .status(200)
                .json(new ApiResponse(200, existingConnection, "Connection request sent again"));
        }
    }

    const connection = await Connection.create({
        sender: senderId,
        receiver: receiverId,
    });

    return res
    .status(200)
    .json(new ApiResponse(200, connection, "Connection request sent successfully"));

});

const acceptConnectionRequest = asyncHandler(async(req, res)=>{
    const {requestId} = req.params;

    if(!isValidObjectId(requestId)){
        throw new ApiError(400, "Invalid request ID");
    }

    const connectionRequest = await Connection.findById(requestId);
    
    if(!connectionRequest){
        throw new ApiError(404, "Connection request not found");
    }

    if(connectionRequest.receiver.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You don't have permission to accept this request");
    }

    if (connectionRequest.status !== "Pending") {
        throw new ApiError(400, "Invalid connection request");
    }

    connectionRequest.status = 'Accepted';
    await connectionRequest.save();

    return res
        .status(201)
        .json(new ApiResponse(200, connectionRequest, "Connection request accepted"));
});

const removeConnection = asyncHandler(async(req, res)=>{
    const { requestId } = req.params;

    if (!isValidObjectId(requestId)){
        throw new ApiError(400, "Invalid ID");
    }

    const connection = await Connection.findById(requestId);
    if (!connection){
        throw new ApiError(404, "Connection not found");
    }

    if (
        connection.sender.toString() !== req.user._id.toString() &&
        connection.receiver.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, "You do not have permission to perform this action");
    }

    await Connection.findByIdAndDelete(requestId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Connection removed successfully"));
});

const getPendingRequests = asyncHandler(async (req, res)=>{
    const requests = await Connection.find({
        receiver: req.user._id,
        status: 'Pending'
    })
    .sort({ createdAt: -1 })
    .populate("sender", "fullName username profileImage schoolName className board");

    return res
        .status(200)
        .json(new ApiResponse(200, requests, "Pending requests fetched successfully"));
});

const getMyConnections = asyncHandler(async (req, res) => {
    const loggedInUserId = req.user._id;

    const connections = await Connection.find({
        $or: [{ sender: loggedInUserId }, { receiver: loggedInUserId }],
        status: 'Accepted'
    })
    .populate("sender", "fullName username profileImage schoolName className board")
    .populate("receiver", "fullName username profileImage schoolName className board");

    //map through the array to extract the "other" user (not the logged in user)
    const connectedUsers = connections.map(conn => {
        if (conn.sender._id.toString() === loggedInUserId.toString()) {
            return conn.receiver;
        } else {
            return conn.sender;
        }
    });

    return res
        .status(200)
        .json(new ApiResponse(200, connectedUsers, "Connections fetched successfully"));
});

export {
    sendConnectionRequest,
    acceptConnectionRequest,
    removeConnection,
    getPendingRequests,
    getMyConnections
}