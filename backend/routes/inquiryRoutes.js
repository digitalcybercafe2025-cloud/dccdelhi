const express = require('express');
const router = express.Router();
const {
    createInquiry,
    getInquiries,
    updateInquiryStatus
} = require('../controllers/inquiryController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', createInquiry);
router.get('/', protect, getInquiries);
router.put('/:id', protect, updateInquiryStatus);

module.exports = router;
