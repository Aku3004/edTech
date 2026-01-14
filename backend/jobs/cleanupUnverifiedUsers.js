import cron from "node-cron";
import User from "../models/userModel.js";
import { EMAIL_VERIFICATION_GRACE_PERIOD } from "../config/constant.js";

export const startCleanupUnverifiedUsersJob=()=>{
    cron.schedule("0 0 * * *",async ()=>{
        try{
            const cutoffTime=
              new Date(Date.now()-EMAIL_VERIFICATION_GRACE_PERIOD);
            
            const result=await User.deleteMany({
                isEmailVerified:false,
                createdAt:{$lt:cutoffTime},
            });

            console.log(`[CLEANUP JOB] Deleted ${result.deletedCount} unverified users`)
        }catch(err){
        console.error("[CLEANUP JOB] Error cleaning unverified users:",err.message);
              }
    });
};
