import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        passwordHash: {
            type: String,
        },
        role: {
            type: String,
            enum: ["learner", "educator"],
        },
        authProvider: {
            type: String,
            enum: ["local", "google"],
            required: true,
            default: "local",
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verifiedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.index({ email: 1 });
userSchema.index({ createdAt: 1 });

const User = mongoose.model("User", userSchema);

export default User;