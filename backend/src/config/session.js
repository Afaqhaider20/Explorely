import session from 'express-session';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';


dotenv.config();


export const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/Explorely',
      collectionName: 'sessions',
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  });

  // Set up session store
// this saves the session object in our database.
// this functionality is provided by connect.mongo.

