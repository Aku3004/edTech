import mongoose from "mongoose";
import User from "./User.js";

const sessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        refreshTokenHash: {
            type: String,
            required: true,
        },
        deviceInfo: {
            type: String,
        },
        ipAddress: {
            type: String,
        },
        expiresAt: {
            type: Date,
        },
        revoked: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

sessionSchema.index({ userId: 1 });
sessionSchema.index({ expiresAt: 1 });
const Session = mongoose.model("Session", sessionSchema);

export default Session;