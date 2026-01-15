import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import APPError from "../utils/appError.js";
import catchAsync from "../utils/asyncHandler.js";

export const protect= catchAsync(async(req,res,next)=>{
         let token;

    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token=req.headers.authorization.split(" ")[1];
    }

    if(!token){
        return next(new APPError("You are not logged in",401));
    }

   
    const decoded=jwt.verify(token,process.env.JWT_SECRET);

    const user=await User.findById(decoded.id);

    if(!user){
        return next(new APPError("User no longer exists",401));
    }

    req.user=user;
    next();
});