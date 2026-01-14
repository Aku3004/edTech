
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({path:"./config.env"});
import app from "./app.js";

const port=process.env.PORT || 5000;

const connectDB=async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MONGODB Connection Successful');
    }catch(err){
        console.log("MONGODB connection failed",err.message);
    }
}

connectDB().then(()=>{
    app.listen(port,()=>{
    console.log(`server is listeing on port ${port}`);
});
     });
    