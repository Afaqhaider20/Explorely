const express = require('express');
const router = express.Router();
const { 
    createReport, 
    getUserReports 
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

// User routes
router.post('/', protect, createReport);
router.get('/user', protect, getUserReports);

module.exports = router; 