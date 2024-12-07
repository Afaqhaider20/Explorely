// middleware/registerMiddleware.js
import User from '../models/User.js';

const checkRegisterFields = async (req, res, next) => {
  const { email, username } = req.body;
  
  // Validate if email and username exist
  if (!email || !username) {
    return res.status(400).send({ message: 'Email and Username are required.' });
  }

  // Check if the email or username already exists
  const existingEmail = await User.findOne({ email });
  const existingUsername = await User.findOne({ username });

  if (existingEmail) {
    return res.status(400).send({ message: 'Email already registered.' });
  }
  if (existingUsername) {
    return res.status(400).send({ message: 'Username already taken.' });
  }

  next(); // Proceed to controller if all validations pass
};

export default checkRegisterFields;
