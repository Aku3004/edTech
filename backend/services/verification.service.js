import Verification from "../models/Verification.js";
import User from "../models/User.js";
import { generateOtp } from "../utils/crypto.js";

const OTP_EXPIRY_MINUTES = 3;
const MAX_ATTEMPTS = 3;
const MAX_RESENDS_PER_24_HOURS = 5;

export async function createEmailVerification(userId) {
    await Verification.deleteMany({ userId, type: "email_verification" });

    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

    await Verification.create({
        userId,
        token: otp,
        type: "email_verification",
        expiresAt,
    });

    return otp;
}

export async function verifyEmailOtp(userId, otp) {
    const record = await Verification.findOne({ userId, type: "email_verification" });
    if (!record) {
        throw new Error("No verification record found.");
    }
    if (record.expiresAt < new Date()) {
        await Verification.deleteOne({ _id: record._id });
        throw new Error("OTP has expired.");
    }
    if (record.attempts >= MAX_ATTEMPTS) {
        await Verification.deleteOne({ _id: record._id });
        throw new Error("Maximum verification attempts exceeded.");
    }
    if (record.token !== otp.toUpperCase()) {
        record.attempts += 1;
        await record.save();
        throw new Error("Invalid OTP.");
    }
    await User.findByIdAndUpdate(userId, {
        isVerified: true,
        verifiedAt: new Date(),
    });
    await Verification.deleteOne({ _id: record._id });
    return true;
}

export async function canResendOtp(userId) {
    // TODO
    // 1. Calculate timestamp for 24 hours ago
    // 2. Count how many email_verification records exist after that time
    // 3. If >= MAX_RESENDS_PER_24_HOURS → return false
    // 4. Else → return true
    const since = new Date(Date.now() - 24 * 60 * 60000);
}
