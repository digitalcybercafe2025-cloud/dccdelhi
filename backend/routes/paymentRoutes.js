const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPayments, exportPayments, getStats, updatePaymentStatus } = require('../controllers/paymentController');

router.get('/', protect, getPayments);
router.get('/export', protect, exportPayments);
router.get('/stats', protect, getStats);
router.patch('/:id/status', protect, updatePaymentStatus);
router.put('/:id/status', protect, updatePaymentStatus);

module.exports = router;
