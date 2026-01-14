import express from "express";
import morgan from "morgan";
import errorHandler from "./controllers/errorController.js"
import userRouter from "./routes/userRoutes.js"


const app=express();

app.use(express.json());
app.use(morgan('dev'));


app.use('/api/v1/auth',authRouter);

app.use((req,res,next)=>{
     next(new APPError(`can't find ${req.originalUrl} on this server!`,404));
})




app.use(errorHandler);

export default app;




