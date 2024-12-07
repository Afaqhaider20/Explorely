import express from "express";
import loginMiddleware from "../middlewares/loginMiddleware.js";
import checkRegisterFields from '../middlewares/registerMiddleware.js';
import { checkUsernameAvailability } from '../middlewares/checkUsernameMiddleware.js';
import { checkEmailAvailability } from '../middlewares/checkEmailMiddleware.js';
import { registerUser } from '../controllers/authController.js';

const router = express.Router();

// Register route using middleware for validation
router.post("/register", checkRegisterFields, registerUser);
//login route
router.post("/login", loginMiddleware);
// Logout route
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res
        .status(500)
        .send({ message: "Error logging out", error: err.message });
    }
    res.status(200).send({ message: "Logout successful" });
  });
});
// Protected route
router.get("/protected", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).send({ message: "Welcome to the protected route!" });
  } else {
    res.status(401).send({ message: "Unauthorized access" });
  }
});

// Route to check username availability
router.get("/check-username", checkUsernameAvailability, (req, res) => {
  res.status(200).json({ message: "Username is available." });
});

// Route to check email availability
router.get("/check-email", checkEmailAvailability, (req, res) => {
  res.status(200).json({ message: "Email is available." });
});

// Export the router
export default router;
