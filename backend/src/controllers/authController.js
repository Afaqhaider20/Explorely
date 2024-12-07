import passport from 'passport';
import User from '../models/User.js'; // Assuming your User model is located in ../models/User.js

// Register User Controller
export const registerUser = async (req, res) => {
  try {
    const { email, name, username, password } = req.body;
    
    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).send({ message: 'Email already registered' });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).send({ message: 'Username already taken' });
    }

    // Create new user instance
    const newUser = new User({
      email,
      name,
      username,
    });

    // Register the new user with the hashed password
    const registeredUser = await User.register(newUser, password);
    
    // Authenticate and log in the user automatically after registration
    passport.authenticate('local')(req, res, () => {
      res.status(201).send({
        message: 'Registration successful',
        user: {
          id: registeredUser._id,
          email: registeredUser.email,
          name: registeredUser.name,
          username: registeredUser.username,
        },
      });
    });

  } catch (err) {
    console.error('Error during registration:', err.message);
    res.status(500).send({
      message: 'Error registering user',
      error: err.message,
    });
  }
};
