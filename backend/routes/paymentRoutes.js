const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPayments, exportPayments, getStats } = require('../controllers/paymentController');

router.get('/', protect, getPayments);
router.get('/export', protect, exportPayments);
router.get('/stats', protect, getStats);

module.exports = router;
