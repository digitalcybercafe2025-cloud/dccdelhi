const express = require('express');
const router = express.Router();
const {
    getServices,
    getAllServices,
    getServiceById,
    createService,
    updateService,
    toggleService,
    deleteService,
    serviceUpload
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

// Public Routes
router.get('/', getServices);
router.get('/all', protect, getAllServices);
router.get('/:id', getServiceById);

// Admin Routes (with image upload support)
router.post('/', protect, serviceUpload.single('image'), createService);
router.put('/:id', protect, serviceUpload.single('image'), updateService);
router.patch('/:id/toggle', protect, toggleService);
router.delete('/:id', protect, deleteService);

module.exports = router;
