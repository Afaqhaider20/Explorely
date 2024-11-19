import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';
import bodyParser from 'body-parser';


const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());




app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})