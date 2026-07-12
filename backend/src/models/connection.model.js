import mongoose, {Schema} from "mongoose";

const connectionSchema = new Schema(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["Pending", "Accepted", "Rejected"],
            default: "Pending",
        }
    },
    {timestamps: true}
);


export const Connection = mongoose.model("Connection", connectionSchema)