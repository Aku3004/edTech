import express from "express";
import {signup,verifyEmail,resendVerificationEmail,login,forgotPassword,resetPassword,refreshAccessToken,logout,googleAuth} from "../controllers/authController.js";
import {protect} from "../middleware/authMiddleware.js";

const router=express.Router();

router.post('/signup',signup);
router.get('/verify-email/:token',verifyEmail);
router.post('/resend-verification-email',resendVerificationEmail);
router.post('/login',login);
router.post('/forgot-password',forgotPassword);
router.post('/reset-password/:token',resetPassword);
router.post('/google',googleAuth);
router.post('/logout',protect,logout);
router.post('/refresh-token',refreshAccessToken);


export default router;