const Application = require('../models/Application');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { generateAcknowledgementReceipt } = require('../utils/pdfGenerator');

// Multer for certificate upload
const certStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/certificates');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `cert-${Date.now()}${ext}`);
    }
});
const uploadCertificateMiddleware = multer({
    storage: certStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpg|jpeg|png|pdf/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = /image\/jpeg|image\/png|application\/pdf/.test(file.mimetype);
        if (ext && mime) cb(null, true);
        else cb(new Error('Only JPG, PNG, PDF allowed for certificates'));
    }
});

// ─── Helper: safe parse JSON ────────────────────────────────────────────────
const safeJsonParse = (val) => {
    if (typeof val === 'object' && val !== null) return val;
    try { return JSON.parse(val); } catch { return null; }
};

// @desc    Create new application
// @route   POST /api/applications
// @access  Public
const createApplication = async (req, res) => {
    try {
        const { serviceName, serviceId, userDetails, paymentDetails, serviceSpecificFields } = req.body;

        if (!serviceName || !serviceId) {
            return res.status(400).json({ success: false, message: 'Service name and ID are required.' });
        }

        const parsedUserDetails = safeJsonParse(userDetails);
        if (!parsedUserDetails || !parsedUserDetails.fullName || !parsedUserDetails.mobile || !parsedUserDetails.address) {
            return res.status(400).json({ success: false, message: 'Invalid or incomplete user details.' });
        }

        const parsedPaymentDetails = safeJsonParse(paymentDetails);
        if (!parsedPaymentDetails || !parsedPaymentDetails.transactionId) {
            return res.status(400).json({ success: false, message: 'Payment details are required. Complete payment before submitting.' });
        }

        const parsedSpecificFields = safeJsonParse(serviceSpecificFields) || {};

        // Generate Tracking ID: SVC-YYYY-RANDOM6
        const serviceCode = serviceName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
        const year = new Date().getFullYear();
        const random = Math.floor(100000 + Math.random() * 900000);
        const trackingId = `${serviceCode}-${year}-${random}`;

        // Map uploaded files to document records
        let documents = [];
        if (req.files && req.files.length > 0) {
            documents = req.files.map(file => ({
                docType: file.fieldname,
                fileName: file.filename,
                filePath: `uploads/${file.filename}`,
                originalName: file.originalname,
                mimeType: file.mimetype,
                fileSize: file.size
            }));
        }

        const application = await Application.create({
            trackingId,
            serviceName,
            serviceId,
            userDetails: parsedUserDetails,
            serviceSpecificFields: parsedSpecificFields,
            documents,
            paymentDetails: {
                amount: parsedPaymentDetails.amount || 0,
                transactionId: parsedPaymentDetails.transactionId,
                paymentId: parsedPaymentDetails.paymentId || parsedPaymentDetails.transactionId,
                method: parsedPaymentDetails.method || 'upi',
                paymentStatus: parsedPaymentDetails.paymentStatus || 'Paid',
                paymentDate: parsedPaymentDetails.paymentDate || new Date()
            },
            status: 'received'
        });

        res.status(201).json({ success: true, data: application });
    } catch (error) {
        console.error('Create Application Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
};

// @desc    Get application status by tracking ID
// @route   GET /api/applications/track/:id
// @access  Public
const trackApplication = async (req, res) => {
    try {
        const application = await Application.findOne({ trackingId: req.params.id })
            .select('-serviceSpecificFields -__v');

        if (application) {
            res.json({ success: true, data: application });
        } else {
            res.status(404).json({ success: false, message: 'Application not found. Check your Tracking ID.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all applications (Admin) with search/filter/pagination
// @route   GET /api/applications
// @access  Private/Admin
const getApplications = async (req, res) => {
    try {
        const { search, status, serviceId, startDate, endDate, page = 1, limit = 15 } = req.query;
        let query = {};

        if (status && status !== 'all') query.status = status;
        if (serviceId && serviceId !== 'all') query.serviceId = serviceId;

        // Date range filter on createdAt
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            query.$or = [
                { trackingId: searchRegex },
                { serviceName: searchRegex },
                { 'userDetails.fullName': searchRegex },
                { 'userDetails.mobile': searchRegex },
                { 'userDetails.email': searchRegex }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Application.countDocuments(query);
        let applications = await Application.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-__v');

        // Normalize paths for frontend
        applications = applications.map(app => {
            const appObj = app.toObject();
            if (appObj.documents) {
                appObj.documents = appObj.documents.map(doc => ({
                    ...doc,
                    filePath: doc.filePath.includes('uploads/')
                        ? doc.filePath.substring(doc.filePath.indexOf('uploads/'))
                        : doc.filePath
                }));
            }
            return appObj;
        });

        res.json({
            success: true,
            data: applications,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get application by ID (Admin)
// @route   GET /api/applications/:id
// @access  Private/Admin
const getApplicationById = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (application) {
            const appObj = application.toObject();
            if (appObj.documents) {
                appObj.documents = appObj.documents.map(doc => ({
                    ...doc,
                    filePath: doc.filePath.includes('uploads/')
                        ? doc.filePath.substring(doc.filePath.indexOf('uploads/'))
                        : doc.filePath
                }));
            }
            res.json({ success: true, data: appObj });
        } else {
            res.status(404).json({ success: false, message: 'Application not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update application status (Admin)
// @route   PUT /api/applications/:id
// @access  Private/Admin
const updateApplicationStatus = async (req, res) => {
    try {
        const { status, rejectionReason, adminRemarks, certificateUrl } = req.body;
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (status === 'rejected' && !rejectionReason?.trim()) {
            return res.status(400).json({ success: false, message: 'Rejection reason is required when rejecting an application.' });
        }

        if (status) application.status = status;
        if (rejectionReason !== undefined) application.rejectionReason = rejectionReason;
        if (adminRemarks !== undefined) application.adminRemarks = adminRemarks;
        if (certificateUrl) application.certificateUrl = certificateUrl;

        const updated = await application.save();
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Download a specific document (Admin)
// @route   GET /api/applications/:id/documents/:docIndex/download
// @access  Private/Admin
const downloadDocument = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

        const docIndex = parseInt(req.params.docIndex);
        const doc = application.documents[docIndex];
        if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

        // Resolve absolute path safely
        const filePath = path.resolve(doc.filePath);
        const uploadsDir = path.resolve(path.join(__dirname, '../uploads'));

        // Security: ensure the file is inside the uploads directory
        if (!filePath.startsWith(uploadsDir)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found on server' });
        }

        const downloadName = `${doc.docType || 'document'}-${doc.originalName || doc.fileName}`;
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
        fs.createReadStream(filePath).pipe(res);
    } catch (error) {
        console.error('Download Document Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Upload certificate for completed application (Admin)
// @route   POST /api/applications/:id/certificate
// @access  Private/Admin
const uploadCertificate = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        application.certificateUrl = `/uploads/certificates/${req.file.filename}`;
        application.status = 'completed';
        await application.save();
        res.json({ success: true, data: application });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Generate and Download Acknowledgement Receipt
// @route   GET /api/applications/:id/receipt
// @access  Public (Requires ID or Tracking ID if we implement that later)
const getReceipt = async (req, res) => {
    try {
        const application = await Application.findOne({
            $or: [
                { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
                { trackingId: req.params.id }
            ]
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (application.paymentDetails.paymentStatus !== 'Paid') {
            return res.status(400).json({ success: false, message: 'Receipt can only be generated for paid applications.' });
        }

        const pdfBuffer = await generateAcknowledgementReceipt(application);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Receipt-${application.trackingId}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Receipt Generation Error:', error);
        res.status(500).json({ success: false, message: 'Error generating receipt' });
    }
};

// @desc    Download Certificate (Public)
// @route   GET /api/applications/:id/certificate/download
const downloadCertificate = async (req, res) => {
    try {
        const application = await Application.findOne({
            $or: [
                { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
                { trackingId: req.params.id }
            ]
        });

        if (!application || !application.certificateUrl) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        const filePath = path.resolve(path.join(__dirname, '..', application.certificateUrl));

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found on server' });
        }

        const ext = path.extname(filePath);
        res.setHeader('Content-Disposition', `attachment; filename=Certificate-${application.trackingId}${ext}`);
        res.sendFile(filePath);
    } catch (error) {
        console.error('Download Certificate Error:', error);
        res.status(500).json({ success: false, message: 'Error downloading certificate' });
    }
};


// @desc    Delete application permanently
// @route   DELETE /api/applications/:id
// @access  Private/Admin
const deleteApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Clean up files on disk if any exist
        if (application.documents && application.documents.length > 0) {
            application.documents.forEach(doc => {
                if (doc.filePath) {
                    const fullPath = path.join(__dirname, '..', doc.filePath);
                    if (fs.existsSync(fullPath)) {
                        try { fs.unlinkSync(fullPath); } catch (e) {}
                    }
                }
            });
        }

        if (application.certificateUrl && application.certificateUrl.startsWith('uploads/')) {
            const certPath = path.join(__dirname, '..', application.certificateUrl);
            if (fs.existsSync(certPath)) {
                try { fs.unlinkSync(certPath); } catch (e) {}
            }
        }

        await application.deleteOne();
        res.json({ success: true, message: 'Application deleted permanently' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete single document from application
// @route   DELETE /api/applications/:id/documents/:docIndex
// @access  Private/Admin
const deleteApplicationDocument = async (req, res) => {
    try {
        const { id, docIndex } = req.params;
        const application = await Application.findById(id);
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const index = parseInt(docIndex, 10);
        if (isNaN(index) || index < 0 || index >= application.documents.length) {
            return res.status(400).json({ success: false, message: 'Invalid document index' });
        }

        const docToDelete = application.documents[index];
        if (docToDelete && docToDelete.filePath) {
            const fullPath = path.join(__dirname, '..', docToDelete.filePath);
            if (fs.existsSync(fullPath)) {
                try { fs.unlinkSync(fullPath); } catch (e) {}
            }
        }

        application.documents.splice(index, 1);
        await application.save();

        res.json({ success: true, message: 'Document deleted successfully', data: application.documents });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createApplication,
    deleteApplication,
    deleteApplicationDocument,
    trackApplication,
    getApplications,
    updateApplicationStatus,
    getApplicationById,
    downloadDocument,
    uploadCertificate,
    uploadCertificateMiddleware,
    getReceipt,
    downloadCertificate
};
