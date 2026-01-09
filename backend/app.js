const express=require('express');
const morgan=require('morgan');
const errorHandler=require("./controllers/errorController")

const app=express();

app.use(express.json());
app.use(morgan('dev'));




app.use(errorHandler);
module.exports=app;




