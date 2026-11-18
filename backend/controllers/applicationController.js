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

        const parsedPaymentDetails = safeJsonParse(paymentDetails) || {};
        const paymentMethod = (parsedPaymentDetails.method || 'upi').toLowerCase();

        // Detect optional payment screenshot in multipart files
        const allUploadedFiles = req.files || [];
        const screenshotFile = allUploadedFiles.find(f => f.fieldname === 'paymentScreenshot');
        const documentFiles = allUploadedFiles.filter(f => f.fieldname !== 'paymentScreenshot');

        let finalTransactionId = (parsedPaymentDetails.transactionId || '').trim();
        let paymentStatus = 'PENDING_VERIFICATION';
        let evidenceType = 'none';
        let screenshotUrl = '';

        if (paymentMethod === 'cash') {
            finalTransactionId = `CASH-${Date.now()}`;
            paymentStatus = 'PAYMENT_PENDING';
            evidenceType = 'cash';
        } else {
            // UPI Payment verification rules (Module 8)
            const hasUtr = Boolean(finalTransactionId);
            const hasScreenshot = Boolean(screenshotFile);

            if (!hasUtr && !hasScreenshot) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment evidence required: please enter your 12-digit UPI UTR number or upload a Payment Screenshot.'
                });
            }

            if (hasUtr) {
                if (!/^[0-9]{12}$/.test(finalTransactionId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid UTR: UPI Reference Number must be exactly 12 numeric digits (e.g. 412389123456).'
                    });
                }
                const existingWithSameUtr = await Application.findOne({
                    'paymentDetails.transactionId': finalTransactionId
                });
                if (existingWithSameUtr) {
                    return res.status(400).json({
                        success: false,
                        message: `This UPI UTR number (${finalTransactionId}) has already been submitted for Application #${existingWithSameUtr.trackingId}. Duplicate payment references are flagged.`
                    });
                }
            } else {
                finalTransactionId = `UPI-SS-${Date.now()}`;
            }

            if (screenshotFile) {
                screenshotUrl = `uploads/${screenshotFile.filename}`;
            }

            if (hasUtr && hasScreenshot) evidenceType = 'both';
            else if (hasUtr) evidenceType = 'utr_only';
            else evidenceType = 'screenshot_only';

            // Under Module 8: MUST NEVER be automatically marked as Paid without Admin approval!
            paymentStatus = 'PENDING_VERIFICATION';
        }

        const parsedSpecificFields = safeJsonParse(serviceSpecificFields) || {};

        // Generate Tracking ID: SVC-YYYY-RANDOM6
        const serviceCode = serviceName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
        const year = new Date().getFullYear();
        const random = Math.floor(100000 + Math.random() * 900000);
        const trackingId = `${serviceCode}-${year}-${random}`;

        // Map uploaded service documents (excluding payment screenshot)
        let documents = [];
        const parsedDocTypes = safeJsonParse(req.body.documentTypes) || [];
        if (documentFiles.length > 0) {
            documents = documentFiles.map((file, idx) => {
                let fileData = null;
                if (file.path && fs.existsSync(file.path)) {
                    try {
                        const buffer = fs.readFileSync(file.path);
                        fileData = `data:${file.mimetype};base64,${buffer.toString('base64')}`;
                    } catch (e) {
                        console.error('File buffer conversion error:', e);
                    }
                }
                return {
                    docType: parsedDocTypes[idx] || file.fieldname,
                    fileName: file.filename,
                    filePath: fileData || `uploads/${file.filename}`,
                    fileData: fileData,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    fileSize: file.size
                };
            });
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
                transactionId: finalTransactionId,
                paymentId: finalTransactionId,
                method: paymentMethod,
                paymentStatus: paymentStatus,
                paymentDate: new Date(),
                screenshotUrl: screenshotUrl || undefined,
                evidenceType: evidenceType,
                auditLog: [{
                    action: 'APPLICATION_CREATED',
                    performedBy: parsedUserDetails.fullName || 'Customer',
                    timestamp: new Date(),
                    note: `Submitted via ${paymentMethod === 'cash' ? 'Cash at Counter' : 'UPI Payment'} (${evidenceType})`
                }]
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
        let application;
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            application = await Application.findById(req.params.id);
        }
        if (!application) {
            application = await Application.findOne({ trackingId: req.params.id });
        }
        if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

        const docIndex = parseInt(req.params.docIndex, 10);
        const doc = application.documents && application.documents[docIndex];
        if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

        // If doc.fileData or doc.filePath is a data URL (base64)
        const dataUri = (doc.fileData && doc.fileData.startsWith('data:'))
            ? doc.fileData
            : (doc.filePath && doc.filePath.startsWith('data:'))
                ? doc.filePath
                : null;

        if (dataUri) {
            const matches = dataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const mimeType = matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                const downloadName = `${doc.docType || 'document'}-${doc.originalName || doc.fileName || 'file'}`;
                res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
                res.setHeader('Content-Type', mimeType);
                return res.send(buffer);
            }
        }

        // Clean relative filename/path
        const rawPath = String(doc.filePath || doc.fileName || '').trim();
        const baseName = path.basename(rawPath);
        const relPath = rawPath.replace(/^[\\/]+/, '').replace(/^uploads[\\/]/, '');

        // Search in all candidate directories (backend/uploads, uploads, etc.)
        const uploadsDir = path.resolve(path.join(__dirname, '../uploads'));
        const candidatePaths = [
            path.join(uploadsDir, baseName),
            path.join(uploadsDir, relPath),
            path.resolve(path.join(__dirname, '../../uploads', baseName)),
            path.resolve(process.cwd(), 'backend', 'uploads', baseName),
            path.resolve(process.cwd(), 'uploads', baseName),
            path.resolve(process.cwd(), rawPath)
        ];

        let filePath = candidatePaths.find(p => fs.existsSync(p));

        if (!filePath || !fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Document file not found on server' });
        }

        const downloadName = `${doc.docType || 'document'}-${doc.originalName || doc.fileName || baseName}`;
        res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
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
