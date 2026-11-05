const Application = require('../models/Application');

// @desc  Get all payments (extracted from applications)
// @route GET /api/payments
const getPayments = async (req, res) => {
    try {
        const { startDate, endDate, status, search, page = 1, limit = 20 } = req.query;

        let query = {};

        if (status && status !== 'all') {
            query['paymentDetails.paymentStatus'] = status;
        }

        if (startDate || endDate) {
            query['paymentDetails.paymentDate'] = {};
            if (startDate) query['paymentDetails.paymentDate'].$gte = new Date(startDate);
            if (endDate) query['paymentDetails.paymentDate'].$lte = new Date(new Date(endDate).setHours(23, 59, 59));
        }

        if (search) {
            query.$or = [
                { 'userDetails.fullName': { $regex: search, $options: 'i' } },
                { 'paymentDetails.transactionId': { $regex: search, $options: 'i' } },
                { trackingId: { $regex: search, $options: 'i' } },
                { serviceName: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Application.countDocuments(query);
        const applications = await Application.find(query)
            .sort({ 'paymentDetails.paymentDate': -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('trackingId serviceName userDetails paymentDetails adminRemarks createdAt');

        const payments = applications.map(app => {
            const status = app.paymentDetails?.paymentStatus || 'Pending';
            const date = app.paymentDetails?.paymentDate || app.createdAt;
            return {
                _id: app._id,
                applicationId: app.trackingId || app._id,
                trackingId: app.trackingId,
                serviceName: app.serviceName,
                userName: app.userDetails?.fullName || 'N/A',
                userMobile: app.userDetails?.mobile || 'N/A',
                userEmail: app.userDetails?.email || '',
                userAddress: [app.userDetails?.city, app.userDetails?.state].filter(Boolean).join(', ') || 'N/A',
                amount: app.paymentDetails?.amount || 0,
                method: app.paymentDetails?.method || 'upi',
                transactionId: app.paymentDetails?.transactionId || 'N/A',
                status: status,
                paymentStatus: status,
                adminRemarks: app.adminRemarks || app.paymentDetails?.adminRemark || '',
                createdAt: date,
                paymentDate: date
            };
        });

        res.json({
            success: true,
            data: payments,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc  Export payments as CSV
// @route GET /api/payments/export
const exportPayments = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        let query = {};
        if (status && status !== 'all') query['paymentDetails.paymentStatus'] = status;
        if (startDate || endDate) {
            query['paymentDetails.paymentDate'] = {};
            if (startDate) query['paymentDetails.paymentDate'].$gte = new Date(startDate);
            if (endDate) query['paymentDetails.paymentDate'].$lte = new Date(new Date(endDate).setHours(23, 59, 59));
        }

        const applications = await Application.find(query)
            .sort({ 'paymentDetails.paymentDate': -1 })
            .select('trackingId serviceName userDetails paymentDetails createdAt');

        const rows = [
            ['Tracking ID', 'Service', 'Customer Name', 'Mobile', 'Amount (₹)', 'Transaction ID', 'Status', 'Date']
        ];
        applications.forEach(app => {
            rows.push([
                app.trackingId,
                app.serviceName,
                app.userDetails?.fullName || '',
                app.userDetails?.mobile || '',
                app.paymentDetails?.amount || 0,
                app.paymentDetails?.transactionId || '',
                app.paymentDetails?.paymentStatus || '',
                app.paymentDetails?.paymentDate ? new Date(app.paymentDetails.paymentDate).toLocaleDateString('en-IN') : ''
            ]);
        });

        const csv = rows.map(r => r.join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc  Dashboard stats
// @route GET /api/payments/stats
const getStats = async (req, res) => {
    try {
        const total = await Application.countDocuments();
        const pending = await Application.countDocuments({ status: 'received' });
        const reviewing = await Application.countDocuments({ status: 'review' });
        const verifying = await Application.countDocuments({ status: 'verifying' });
        const completed = await Application.countDocuments({ status: 'completed' });
        const rejected = await Application.countDocuments({ status: 'rejected' });

        const earningsAgg = await Application.aggregate([
            { $match: { 'paymentDetails.paymentStatus': 'Paid' } },
            { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
        ]);
        const totalEarnings = earningsAgg[0]?.total || 0;

        let recent = await Application.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .select('trackingId serviceName userDetails.fullName userDetails.mobile status createdAt paymentDetails.amount documents');

        recent = recent.map(app => {
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
            data: { total, pending, reviewing, verifying, completed, rejected, totalEarnings, recent }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc  Update payment status (Verify / Reject with remarks)
// @route PATCH /api/payments/:id/status
const updatePaymentStatus = async (req, res) => {
    try {
        const { status, adminRemarks } = req.body;
        const normalizedStatus = ['Paid', 'Pending', 'Failed'].includes(status) ? status : (status === 'Paid' ? 'Paid' : 'Pending');

        let app = await Application.findById(req.params.id);
        if (!app) {
            return res.status(404).json({ success: false, message: 'Application/Payment not found' });
        }

        if (!app.paymentDetails) {
            app.paymentDetails = {};
        }

        app.paymentDetails.paymentStatus = normalizedStatus;
        if (adminRemarks !== undefined) {
            app.paymentDetails.adminRemark = adminRemarks;
            app.adminRemarks = adminRemarks;
        }
        if (normalizedStatus === 'Paid' && !app.paymentDetails.paymentDate) {
            app.paymentDetails.paymentDate = new Date();
        }
        await app.save();

        res.json({
            success: true,
            message: `Payment status updated to ${normalizedStatus}`,
            data: {
                _id: app._id,
                status: app.paymentDetails.paymentStatus,
                paymentStatus: app.paymentDetails.paymentStatus,
                adminRemarks: app.adminRemarks
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getPayments, exportPayments, getStats, updatePaymentStatus };
