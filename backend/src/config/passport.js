import passport from 'passport';
import User from '../models/User.js';

export const initializePassport = () => {
  // `passport.use(User.createStrategy())` 
// This configures Passport to use the local authentication strategy, which is typically based on a username (or email) 
// and password. `createStrategy()` is a method provided by `passport-local-mongoose` to automatically set up the local 
// authentication strategy using the `username` and `password` fields in the User model. It simplifies handling user login. 
// It will authenticate a user by checking the username and password against what is stored in the database
  passport.use(User.createStrategy());
  // `passport.serializeUser(User.serializeUser())` 
// This method tells Passport how to serialize user data into the session. Serialization is the process of saving the user 
// information (usually an ID) into the session, so that it can be used across multiple requests. 
// In this case, `User.serializeUser()` will serialize the user by saving the user’s ID (or another identifying field) into the session.
// it initializes a session, for example whenever the user logs in or register.
  passport.serializeUser(User.serializeUser());
  // it parses the session 
// `passport.deserializeUser(User.deserializeUser())` 
// This method is used to deserialize the user data from the session and restore the full user object. It is the reverse 
// process of serialization. Every time a request is made, Passport will call `deserializeUser()` to retrieve the full user 
// object from the session (usually by looking up the user’s ID in the database). 
// `User.deserializeUser()` will take the serialized data (e.g., user ID) and use it to find the full user object from the database.
  passport.deserializeUser(User.deserializeUser());
};