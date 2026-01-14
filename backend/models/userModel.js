import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

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
     passwordHash:{
        type:String,
        required:true,
        select:false
     },
     isEmailVerified:{
        type:Boolean,
        default:false
     },
     emailVerificationToken:String,
     emailExpiryDate:Date

    
},
{
    timestamps:true,
}
);


userSchema.pre('save', async function(){
    if(!this.isModified("passwordHash"))return next();
    this.passwordHash=await bcrypt.hash(this.passwordHash,12);
    next();
});

userSchema.methods.emailVerificationToken=function(){
    const token=crypto.randomBytes(32).toString('hex');

    this.emailVerificationToken=crypto.createHash("sha256").update(token).digest("hex");

    this.emailVerificationExpiry=Date.now()+10*60*1000;

    return token;
}


const User=mongoose.model("User",userSchema);

export default User;
