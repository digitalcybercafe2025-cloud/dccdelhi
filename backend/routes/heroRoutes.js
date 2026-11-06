const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getSlides, getActiveSlides, createSlide, updateSlide, deleteSlide,
    getNotices, getActiveNotices, createNotice, updateNotice, deleteNotice
} = require('../controllers/heroController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Multer config for Hero slides
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

// Public routes
router.get('/slides/active', getActiveSlides);
router.get('/notices/active', getActiveNotices);

// Private/Admin routes
router.get('/slides', protect, isAdmin, getSlides);
router.post('/slides', protect, isAdmin, upload.single('image'), createSlide);
router.put('/slides/:id', protect, isAdmin, upload.single('image'), updateSlide);
router.delete('/slides/:id', protect, isAdmin, deleteSlide);

router.get('/notices', protect, isAdmin, getNotices);
router.post('/notices', protect, isAdmin, createNotice);
router.put('/notices/:id', protect, isAdmin, updateNotice);
router.delete('/notices/:id', protect, isAdmin, deleteNotice);

module.exports = router;
