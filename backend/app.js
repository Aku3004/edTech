const express=require('express');
const morgan=require('morgan');
const errorHandler=require("./controllers/errorController")

const app=express();

app.use(express.json());
app.use(morgan('dev'));

app.use('*',(req,res,next)=>{
    return next(new APPError(`can't find ${req.originalUrl} on this server!`,404));
})


app.use(errorHandler);
module.exports=app;




