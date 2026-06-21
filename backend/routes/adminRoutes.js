const express = require('express');
const router = express.Router();
const { authAdmin, registerAdmin, getProfile, updateProfile, uploadAvatar, avatarUpload, getAllAdmins, updateAdmin, deleteAdmin } = require('../controllers/adminController');
const { getPayments, exportPayments, getStats } = require('../controllers/paymentController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.post('/login', authAdmin);
router.post('/register', protect, isAdmin, registerAdmin); // Protected: only existing admin can create new staff/admin
router.get('/dashboard', protect, getStats);

// Admin / User Management routes
router.get('/users', protect, isAdmin, getAllAdmins);
router.put('/users/:id', protect, isAdmin, updateAdmin);
router.delete('/users/:id', protect, isAdmin, deleteAdmin);

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/upload-avatar', protect, avatarUpload.single('avatar'), uploadAvatar);

module.exports = router;
