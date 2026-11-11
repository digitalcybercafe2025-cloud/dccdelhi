const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
    authAdmin,
    signupWithCode,
    verifyRecoveryPin,
    resetPasswordWithToken,
    registerAdmin,
    getProfile,
    updateProfile,
    getSecurityConfig,
    updateSecurityConfig,
    uploadAvatar,
    avatarUpload,
    getAllAdmins,
    updateAdmin,
    deleteAdmin
} = require('../controllers/adminController');
const { getStats } = require('../controllers/paymentController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Strict rate limit for authentication, signup & recovery endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts from this network. Please wait 15 minutes.' }
});

router.post('/login', authLimiter, authAdmin);
router.post('/signup', authLimiter, signupWithCode);
router.post('/forgot-password/verify', authLimiter, verifyRecoveryPin);
router.post('/forgot-password/reset', authLimiter, resetPasswordWithToken);

router.post('/register', protect, isAdmin, registerAdmin); // Protected: only existing admin can create new staff/admin
router.get('/dashboard', protect, getStats);

// Security Invite Code configuration (Super Admin only)
router.get('/security-config', protect, isAdmin, getSecurityConfig);
router.put('/security-config', protect, isAdmin, updateSecurityConfig);

// Admin / User Management routes
router.get('/users', protect, isAdmin, getAllAdmins);
router.put('/users/:id', protect, isAdmin, updateAdmin);
router.delete('/users/:id', protect, isAdmin, deleteAdmin);

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/upload-avatar', protect, avatarUpload.single('avatar'), uploadAvatar);

module.exports = router;
