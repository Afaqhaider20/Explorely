const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { 
    registerUser, 
    loginUser, 
    getProfile, 
    logoutUser, 
    updateProfile 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', protect, getProfile);
router.post('/logout', protect, logoutUser);

// Combine profile updates in one endpoint
router.patch('/profile', protect, upload.single('avatar'), updateProfile);

// Remove individual update routes
// router.patch('/avatar', protect, upload.single('avatar'), updateAvatar);
// router.patch('/bio', protect, updateBio);

// Temporary route for testing
router.get('/', (req, res) => {
    res.status(200).json({ message: 'User routes working' });
});

module.exports = router;
