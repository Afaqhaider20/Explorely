import express from 'express';
import passport from 'passport';
import authRoutes from './routes/authRoutes.js';
import { sessionMiddleware } from './config/session.js';
import { initializePassport } from './config/passport.js';
import connectDB from './config/db.js';



// Initialize Express app
const app = express();
//the server port
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express.json());

// Set up session
app.use(sessionMiddleware);

//Initialize Passport to use local strategy
initializePassport();

// Initialize Passport, it prepares the express app to use passport for authentication.
app.use(passport.initialize());

// it is a middle-ware of passport-session, it is used to allow express to store and retrieve user information through session using cookies.
app.use(passport.session());


app.use('/auth', (req, res, next) => {
  console.log(`I was ran: ${req.method} ${req.originalUrl} at ${new Date().toISOString()}`);
  next(); // Pass control to the next middleware (the actual route handler)
});

//routing all the authentication routes to the authRoutes file
app.use('/auth', authRoutes);

// Start the db
connectDB();

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
