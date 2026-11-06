const express = require('express');
const router = express.Router();
const {
    createApplication,
    trackApplication,
    getApplications,
    updateApplicationStatus,
    getApplicationById,
    downloadDocument,
    uploadCertificate,
    uploadCertificateMiddleware,
    getReceipt,
    downloadCertificate,
    deleteApplication,
    deleteApplicationDocument
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.post('/', upload.any(), createApplication);
router.get('/track/:id', trackApplication);
router.get('/:id/receipt', getReceipt);
router.get('/:id/certificate/download', downloadCertificate);

// Admin protected routes
router.get('/', protect, getApplications);
router.get('/:id', protect, getApplicationById);
router.put('/:id', protect, updateApplicationStatus);
router.delete('/:id', protect, deleteApplication);
router.delete('/:id/documents/:docIndex', protect, deleteApplicationDocument);
router.get('/:id/documents/:docIndex/download', protect, downloadDocument);
router.post('/:id/certificate', protect, uploadCertificateMiddleware.single('certificate'), uploadCertificate);

module.exports = router;
