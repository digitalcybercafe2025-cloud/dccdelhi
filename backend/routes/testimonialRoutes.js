const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getTestimonials,
    getAllTestimonials,
    createTestimonial,
    updateTestimonial,
    toggleActive,
    deleteTestimonial,
    upload
} = require('../controllers/testimonialController');

router.get('/', getTestimonials);
router.get('/all', protect, getAllTestimonials);
router.post('/', protect, upload.single('image'), createTestimonial);
router.put('/:id', protect, upload.single('image'), updateTestimonial);
router.patch('/:id/toggle', protect, toggleActive);
router.delete('/:id', protect, deleteTestimonial);

module.exports = router;
