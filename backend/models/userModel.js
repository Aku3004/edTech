import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { EMAIL_TOKEN_EXPIRY,PASSWORD_TOKEN_EXPIRY } from "../config/constant.js";

const userSchema= new mongoose.Schema({
     email:{
        type:String,
        required:true,
        validate:{
            validator:validator.isEmail,
            message:"Invalid email"
        },
        unique:true,
        lowercase:true,
        trim:true,
        index:true
     },
     authProvider:{
        type:String,
        enum:["local","google"],
        default:"local"
     },
     googleId:{
        type:String,
        index:true,
        sparse:true
     },
     passwordHash:{
        type:String,
        required:function(){
           return this.authProvider === "local";
        },
        select:false
     },
     isEmailVerified:{
        type:Boolean,
        default:false
     },
     role:{
        type:String,
        enum:["student","educator","admin"],
        default:"student"
     },
     refreshTokens:[
      {
        token:String,
        createdAt:Date,
        userAgent:String,
     }
   ],
     emailVerificationToken:String,
     emailVerificationExpiry: Date,
     emailVerificationLastSentAt:Date,
     passwordResetToken:String,
     passwordResetExpiry:Date
},
{
    timestamps:true,
}
);


userSchema.pre('save', async function(){
    if(!this.isModified("passwordHash"))return;
    this.passwordHash=await bcrypt.hash(this.passwordHash,12);
});

userSchema.methods.generateEmailVerificationToken=function(){
    const token=crypto.randomBytes(32).toString('hex');

    this.emailVerificationToken=crypto.createHash("sha256").update(token).digest("hex");

    this.emailVerificationExpiry=Date.now()+EMAIL_TOKEN_EXPIRY;

    return token;
}

userSchema.methods.generatePasswordResetToken=function(){

    const token=crypto.randomBytes(32).toString("hex");

    this.passwordResetToken=crypto
    .createHash('sha256')
    .update('token')
    .digest('hex');

    this.passwordResetExpiry=Date.now() + PASSWORD_TOKEN_EXPIRY;

    return token;
}

userSchema.methods.comparePassword=async function (candidatePassword){
    return await bcrypt.compare(candidatePassword,this.passwordHash);
}

const User=mongoose.model("User",userSchema);

export default User;
