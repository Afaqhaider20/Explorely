import User from "../models/User.js";

export const checkEmailAvailability = async (req, res, next) => {
  const { email } = req.body;

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  try {
    // Check if the email already exists in the database
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Email is already taken." });
    }

    // If everything is valid, proceed to the next middleware/route handler
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};
