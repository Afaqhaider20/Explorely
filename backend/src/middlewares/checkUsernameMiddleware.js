import User from "../models/User.js";

export const checkUsernameAvailability = async (req, res, next) => {
  const { username } = req.body;

  // Validate input length
  if (!username || username.length < 6) {
    return res.status(400).json({ message: "Username must be at least 6 characters long." });
  }

  try {
    // Check if the username already exists in the database
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "Username is already taken." });
    }

    // If everything is valid, proceed to the next middleware/route handler
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};
