import User from "../models/userModel.js";
import { sendVerificationEmail } from "../services/verificationEmail.js";
import { resetPasswordEmail } from "../services/resetPasswordEmail.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/asyncHandler.js"
import crypto from "crypto";
import { generateAccessToken,generateRefreshToken } from "../utils/token.js";


const client=new OAuthClient(process.env.GOOGLE_CLIENT_ID);




export const signup=catchAsync(async(req,res,next)=>{
    const {email,password}=req.body;
     if(!email || ! password){
        return next(new AppError("Email and Password are required",400));
     }
     const user=await User.create({
        email,
        passwordHash:password,
        authProvider:"local"
     });

     const token=await user.generateEmailVerificationToken();
     await user.save({validateBeforeSave:false});

     const verificationURL=`${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${token}`;

     await sendVerificationEmail(user.email,verificationURL);

     res.status(200).json({
        staus:"success",
        message:"user created successfully"
     })

});


export const resendVerificationEmail=catchAsync(async(req,res,next)=>{

    const {email}=req.body;

    if(!email) return next(new AppError('Email is Required',400));

    const user=await User.findOne({email});

    if(!user){
        return res.status(200).json({
        message:"If this email exists, a verification link has been sent"
    });
}

   if(user.isEmailVerified){
    return next(new AppError('Email is already verified',400));
   }

   const token=user.generateEmailVerificationToken();
   await user.save({validateBeforeSave:false});
    
   const verificationURL=`${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${token}`;

    await sendVerificationEmail(user.email,verificationURL);

    res.status(200).json({
        message:"Verification email sent successfully"
    });
    })

export const verifyEmail=catchAsync(async(req,res,next)=>{
    const {token}=req.params.token;

    if(!token){
        return next(new APPError("Invalid verification link",400));
    }

    const hashedToken=crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user=User.findOne({
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



export const login=catchAsync(async(req,res)=>{

    const {email,password}=req.body;

    if(!email || !password){
        return next(new AppError("Both email and password are required",400));
    }

    const user=await User.findOne({email}).select("+passwordHash +refreshToken");

    if(!user || await(user.comparePassword(password))){
        return next(new AppError("Invalid email or password",401));
    }

    if(!user.isEmailVerified){
        return next(new AppError("Please verify your email before logging in",401));
    }

    const accessToken=generateAccessToken(user);
    const refreshToken=generateRefreshToken();

    user.refreshToken=refreshToken;
    await user.save({validateBeforeSave:false});

    res.status(200).json({
        status:"success",
        accessToken,
        user:{
            user
        }
    });

})

export const forgotPassword=catchAsync(async(req,res)=>{
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


export const resetPassword=catchAsync(async(req,res)=>{
    const {token}=req.params;
    const {password}=req.body;

    if(!password){
        return next(new AppError('password is required',400));
    }

    const hashedToken=crypto
         .createHash('sha256')
         .update(token)
         .digest('hex');


    const user=await user.findOne({
        passwordResetToken:hashedToken,
        passwordResetExpiry:{$gt:Date.now()}
    });

    if(!user){
        return next(new AppError("Reset token is invalid or has expired",400));
    }

    user.passwordHash=password;
    user.passwordResetToken=undefined;
    user.passwordResetExpiry=undefined;

    await user.save();

    res.status(200).json({
        message:"password reset successfully. please log in"
    });
})


const googleAuth=catchAsync(async(req,res,next)=>{
     const {idToken}=req.body;

     if(!idToken){
        return next(new AppError("Google token is required",400));
     }

     const ticket=await client.verifyIdToken({
        idToken,
        audience:process.env.GOOGLE_CLIENT_ID
     });

     const payload=ticket.getPayLoad();

     const {
        sub:googleId,
        email,
        email_verified,
        name,
        picture
     }=payload;

     if(!email_verified){
        return next(new AppError("Google email no verified",400));
     }

     let user=await user.findone({
        $or:[{googleId},{email}]
     });

     if(!user){
        user=await User.create({
            email,
            googleId,
            authProvider:"google",
            isEmailVerified:true
        });
     }

     const token=signJWT(user._id,user.role);

     res.status(200).json({
        token,
        user:{
            id:user._id,
            email:user.email,
            role:user.role
        }
     });
});


export const logout=catchAsync(async(req,res,next)=>{
    const user=req.user;

    user.refreshToken=undefined;

    await user.save({validateBeforeSave:false});

    res.status(200).json({
        message:"Loged out successfully"
    });
});


export const refreshAccessToken=catchAsync(async(req,res,next)=>{
    const {refreshToken}=req.body;

    if(!refreshToken){
        return next(new AppError("Refresh token required",401));
    }
    const user=await User.findOne({refreshToken}).select("+refreshToken");

    if(!user){
        return next(new AppError("Invalid refresh token",401));
    }

    const newAccessToken=generateAccessToken(user);
    const newRefreshToken=generateRefreshToken();

    user.refreshToken=newRefreshToken;
    await user.save({validateBeforeSave:false});

    res.status(200).json({
        accessToken:newAccessToken,
        refreshToken:newRefreshToken
    });
});






