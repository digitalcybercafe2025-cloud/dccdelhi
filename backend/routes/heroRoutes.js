const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getSlides, getActiveSlides, createSlide, updateSlide, deleteSlide,
    getNotices, getActiveNotices, createNotice, updateNotice, deleteNotice,
    duplicateNotice, getNoticeSettings, updateNoticeSettings
} = require('../controllers/heroController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Multer config for Hero slides & notices
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/hero');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `hero-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const handleNoticeUpload = (req, res, next) => {
    upload.single('iconImage')(req, res, (err) => {
        if (err) {
            console.warn('Notice upload notice warning:', err.message);
        }
        next();
    });
};

// Public routes
router.get('/slides/active', getActiveSlides);
router.get('/notices/active', getActiveNotices);
router.get('/notices/settings', getNoticeSettings);

// Private/Admin routes
router.get('/slides', protect, isAdmin, getSlides);
router.post('/slides', protect, isAdmin, upload.single('image'), createSlide);
router.put('/slides/:id', protect, isAdmin, upload.single('image'), updateSlide);
router.delete('/slides/:id', protect, isAdmin, deleteSlide);

router.get('/notices', protect, isAdmin, getNotices);
router.get('/notices/settings/admin', protect, isAdmin, getNoticeSettings);
router.put('/notices/settings', protect, isAdmin, updateNoticeSettings);
router.post('/notices', protect, isAdmin, handleNoticeUpload, createNotice);
router.post('/notices/:id/duplicate', protect, isAdmin, duplicateNotice);
router.put('/notices/:id', protect, isAdmin, handleNoticeUpload, updateNotice);
router.delete('/notices/:id', protect, isAdmin, deleteNotice);

module.exports = router;
