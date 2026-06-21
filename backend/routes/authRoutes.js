const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/auth/me
router.get('/me', protect, getProfile);

// @route   PUT /api/auth/profile
router.put('/profile', protect, updateProfile);

module.exports = router;
