import User from "../models/userModel.js";
import { sendVerificationEmail } from "../services/verificationEmail.js";
import resetPasswordEmail from "../services/resetPasswordEmail.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/asyncHandler.js"
import crypto from "crypto";
import {OAuth2Client} from "google-auth-library";
import { generateAccessToken,generateRefreshToken } from "../utils/token.js";
import {COOLDOWN_MS,MAX_DEVICE} from "../config/constant.js";



const client=new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


export const signup=catchAsync(async(req,res,next)=>{
    const {email,password}=req.body;
    // one of the or both fields left blank
     if(!email || ! password){
        return next(new AppError("Email and Password are required",400));
     }
     
    const existingUser=await User.findOne({email});
    // signup but not verified
    if(existingUser && !existingUser.isEmailVerified){
        return res.status(409).json({
            status:"pending_verification",
            message:"Account already exists.Please verify your email."
        })
    }
    // already verified user
    if(existingUser && existingUser.isEmailVerified){
        return res.status(409).json({
            status:"error",
            message:"An account with this email already exists. Please login."
        });
    }

     const user=await User.create({
        email,
        passwordHash:password,
        authProvider:"local"
     });

     const token=await user.generateEmailVerificationToken();
     user.emailVerificationLastSentAt=Date.now();
     await user.save({ validateBeforeSave: false });

     const verificationURL=`${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${token}`;

     await sendVerificationEmail(user.email,verificationURL);

     res.status(201).json({
        status:"success",
        message:"user created successfully. Please verify your email."
     })

});


export const resendVerificationEmail=catchAsync(async(req,res,next)=>{

    const {email}=req.body;

    // if email not provided

    if(!email) return next(new AppError('Email is required',400));

    const user=await User.findOne({email});

    // if user doesn't exist

    if(!user){
        return res.status(200).json({
        message:"If this email exists, a verification link has been sent"
    });
}

   // already verified
   if(user.isEmailVerified){
    return next(new AppError('Email is already verified',400));
   }

   if(user.emailVerificationLastSentAt && Date.now()-user.emailVerificationLastSentAt<COOLDOWN_MS){
    return next(new AppError("Please wait 1 minute before requesting another verification email.",429))
   }

   const token=user.generateEmailVerificationToken();
   user.emailVerificationLastSentAt=Date.now();

   await user.save({validateBeforeSave:false});
    
   const verificationURL=`${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${token}`;

    await sendVerificationEmail(user.email,verificationURL);

    res.status(200).json({
        message:"Verification email sent successfully"
    });
    });


export const verifyEmail=catchAsync(async(req,res,next)=>{
    const token=req.params.token;

    if(!token){
        return next(new AppError("Invalid verification link",400));
    }

    const hashedToken=crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user=await User.findOne({
        emailVerificationToken:hashedToken,
        emailVerificationExpiry:{$gt:Date.now()}
    });

    if(!user){
        return next(
            new AppError("Verification link is invalid or has expired",400)
        );
    }

    user.isEmailVerified=true;
    user.emailVerificationToken=undefined;
    user.emailVerificationExpiry=undefined;

    await user.save({validateBeforeSave:false});

    res.status(200).json({
        message:"Email verified successfully. you can now log in."
    });
})



export const login=catchAsync(async(req,res,next)=>{

    const {email,password}=req.body;

    if(!email || !password){
        return next(new AppError("Both email and password are required",400));
    }

    const user=await User.findOne({email}).select("+passwordHash");

    if(!user || !(await user.comparePassword(password))){
        return next(new AppError("Invalid email or password",401));
    }

    if(!user.isEmailVerified){
        return next(new AppError("Please verify your email before logging in",401));
    }

    if(user.authProvider!=="local"){
        return next(new AppError("Please log in using Google",400));
    }

    user.refreshTokens=user.refreshTokens || [];

    if(user.refreshTokens.length>=MAX_DEVICE){
        user.refreshTokens.sort(
            (token1,token2)=>new Date(token1.createdAt)-new Date(token2.createdAt)
        )
        user.refreshTokens.shift();
    }

    const accessToken=generateAccessToken(user);
    const refreshToken=generateRefreshToken();

    user.refreshTokens.push({
        token:refreshToken,
        createdAt:new Date(),
        userAgent:req.headers["user-agent"],
    })
    await user.save({validateBeforeSave:false});

    res
    .cookie("refeshToken",refreshToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",
        sameSite:"strict",
        path:"/api/v1/auth"
    })
    .status(200).json({
        status:"success",
        accessToken,
            user:{
                id:user._id,
                email:user.email,
                role:user.role
            }
    });

})


export const forgotPassword=catchAsync(async(req,res,next)=>{
    const {email}=req.body;

    if(!email){
        return next(new AppError("Email is required",400));
    }

    const user=await User.findOne({email});

    if(!user){
        return res.status(200).json({
            message:"If this email exits, a reset link has been sent."
        })
    }

    const resetToken=user.generatePasswordResetToken();
    await user.save({validateBeforeSave:false});

    const resetURL=`${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;

    await resetPasswordEmail(user.email,resetURL);

    res.status(200).json({
        message:"If this email exists a resent link has been sent"
    });
})


export const resetPassword=catchAsync(async(req,res,next)=>{
    const token=req.params.token;
    const {password}=req.body;

    if(!password){
        return next(new AppError('password is required',400));
    }

    const hashedToken=crypto
         .createHash('sha256')
         .update(token)
         .digest('hex');


    const user=await User.findOne({
        passwordResetToken:hashedToken,
        passwordResetExpiry:{$gt:Date.now()}
    });

    if(!user){
        return next(new AppError("Reset token is invalid or has expired",400));
    }

    user.passwordHash=password;
    user.passwordResetToken=undefined;
    user.passwordResetExpiry=undefined;
    user.refreshToken=undefined;

    await user.save();

    res.status(200).json({
        message:"password reset successfully. please log in"
    });
})


export const googleAuth=catchAsync(async(req,res,next)=>{
     const {idToken}=req.body;

     if(!idToken){
        return next(new AppError("Google token is required",400));
     }

     const ticket=await client.verifyIdToken({
        idToken,
        audience:process.env.GOOGLE_CLIENT_ID
     });

     const payload=ticket.getPayload();

     const {
        sub:googleId,
        email,
        email_verified,
        name,
        picture
     }=payload;

     if(!email_verified){
        return next(new AppError("Google email is not verified",400));
     }

     let user=await User.findOne({
        $or:[{googleId},{email}]
     });

     if(!user){
        user=await User.create({
            email,
            googleId,
            authProvider:"google",
            isEmailVerified:true,
            role:"student"
        });
     }

    const accessToken=generateAccessToken(user);
    const refreshToken=generateRefreshToken();

    user.refreshToken=refreshToken;
    await user.save({validateBeforeSave:false});

     res.status(200).json({
        accessToken,
        refreshToken,
        user:{
            id:user._id,
            email:user.email,
            role:user.role
        }
     });
});


export const logout=catchAsync(async(req,res,next)=>{
    const token=req.cookies.refreshToken;

    if(!token){
        return res.status(200).json({
            message:"Logged out successfully"
        });
    }
    const user=req.user;

    user.refreshTokens=user.refreshTokens.filter(refreshToken=>refreshToken.token!==token);

    await user.save({validateBeforeSave:false});

    res.clearCookie("refreshToken",{path:"/api/v1/auth"})

    res.status(200).json({
        message:"Logged out successfully"
    });
});


export const refreshAccessToken=catchAsync(async(req,res,next)=>{
    const oldRefreshToken=req.cookies.refreshToken;

    if(!oldRefreshToken){
        return next(new AppError("Refresh token required",401));
    }
  
    const user=await User.findOne({"refreshTokens.token":oldRefreshToken});

    if(!user){
        return next(new AppError("Invalid refresh token",401));
    }

    const tokendetails=user.refreshTokens.find(
        rt=>rt.token===oldRefreshToken
    );

    const newAccessToken=generateAccessToken(user);
    const newRefreshToken=generateRefreshToken();

    tokendetails.token=newRefreshToken;
    tokendetails.createdAt=new Date();
    await user.save({validateBeforeSave:false});

    res.cookie("refreshToken",newRefreshToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",
        sameSite:"strict",
        path:"/api/v1/auth"
    })

    res.status(200).json({
        accessToken:newAccessToken,
    });
});






