import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';
import MongoStore from 'connect-mongo';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Explorely')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define a User Schema
// 
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
});

// whenever the user collection is converted to a json to be retrieved on the client side
// these entries are inherently deleted, this saves the user data to be exploited through scam requests
userSchema.set('toJSON', {
  transform: (_, ret) => {
    delete ret.email;
    delete ret.salt;
    delete ret.hash;
    delete ret.__v; 
  },
});



// this is to connect  passport-local-mongoose to the mongoose schema.
// this automatically handles and implements passport-local-strategy, encryption(salting & hashing) and session management.
userSchema.plugin(passportLocalMongoose);


// Create User Model
const User = mongoose.model('User', userSchema);

// Set up session store
// this saves the session object in our database.
// this functionality is provided by connect.mongo.
const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/yourDB',
  collectionName: 'sessions',
});

// Set up session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Initialize Passport, it prepares the express app to use passport for authentication.
app.use(passport.initialize());
// it is a middle-ware of passport-session, it is used to allow express to store and retrieve user information through session using cookies.
app.use(passport.session());

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







// Routes
app.get('/check-username', async (req, res) => {
  const { username } = req.body;

  try {
    // Validate input length
    if (!username || username.length < 6) {
      return res.status(400).json({ message: 'Username must be at least 6 characters long.' });
    }

    // Check database for existing username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username is already taken.' });
    }

    res.status(200).json({ message: 'Username is available.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Endpoint to check email availability
app.get('/check-email', async (req, res) => {
  const { email } = req.body;

  try {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Check database for existing email
    const existingemail = await User.findOne({ email });
    if (existingemail) {
      return res.status(409).json({ message: 'Email is already taken.' });
    }

    res.status(200).json({ message: 'Email is available.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Register route
app.post('/register', async (req, res) => {
  try {
    const { email, name, username, password } = req.body;

    // Check if the email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).send({ message: 'Email already registered' });
    }

    // Check if the username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).send({ message: 'Username already taken' });
    }

    // Register the user
    const newUser = new User({ email, name, username });
    const registeredUser = await User.register(newUser, password);

    // Authenticate and log in the user
    passport.authenticate('local')(req, res, () => {
      res.status(201).send({ message: 'Registration successful', user: registeredUser });
    });
  } catch (err) {
    res.status(500).send({ message: 'Error registering user', error: err.message });
  }
});
//login middle ware
const loginMiddleware = (req, res, next) => {
  // Use passport's authenticate method with the 'local' strategy
  passport.authenticate('local', (err, user, info) => {      // (.authenticate) it is a method of passport-local-mongoose.
    if (err) {
      return res.status(500).send({ message: 'Error logging in', error: err.message });
    }

    if (!user) {
      return res.status(401).send({ message: 'Invalid username or password' });
    }

    // Log the user in (store the user ID in the session)
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).send({ message: 'Error logging in', error: err.message });
      }

      res.status(200).send({ message: 'Login successful', user });
    });
  })(req, res, next);
};

//login route
app.post('/login', loginMiddleware);

// Logout route
app.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send({ message: 'Error logging out', error: err.message });
    }
    res.status(200).send({ message: 'Logout successful' });
  });
});

// Protected route
app.get('/protected', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).send({ message: 'Welcome to the protected route!' });
  } else {
    res.status(401).send({ message: 'Unauthorized access' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
