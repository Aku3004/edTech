import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken=(user)=>{
    const token=jwt.sign({id:user._id,role:user.role},
        process.env.JWT_ACCESS_SECRET,
        {expires_in:process.env.JWT_EXPIRES_IN}
    );
    return token;
};

export const generateRefreshToken=()=>{
    return crypto.randomBytes(40).toString("hex");
}