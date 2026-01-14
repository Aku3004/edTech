import User from "../models/userModel.js";
import { sendVerificationEmail } from "../services/verificationEmaiil.js";
import AppError from "../utils/appError.js";


export const signup=catchAsync(async(req,res)=>{
    const {email,password}=req.body;
     if(!email || ! password){
        return next(new AppError("Email and Password are required",400));
     }
     const user=await User.create({
        email,
        passwordHash:password,
     });

     const token=await user.emailVerificationToken();
     await user.save({validateBeforeSave:false});

     const verificationURL=`${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${token}`;

     await sendVerificationEmail(user.email,verificationURL);

})