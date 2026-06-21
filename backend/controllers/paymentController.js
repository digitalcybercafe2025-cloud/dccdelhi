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
            .select('trackingId serviceName userDetails paymentDetails createdAt');

        const payments = applications.map(app => ({
            _id: app._id,
            trackingId: app.trackingId,
            serviceName: app.serviceName,
            userName: app.userDetails?.fullName || 'N/A',
            userMobile: app.userDetails?.mobile || 'N/A',
            amount: app.paymentDetails?.amount || 0,
            transactionId: app.paymentDetails?.transactionId || 'N/A',
            paymentStatus: app.paymentDetails?.paymentStatus || 'Pending',
            paymentDate: app.paymentDetails?.paymentDate || app.createdAt
        }));

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

module.exports = { getPayments, exportPayments, getStats };
