const Application = require('../models/Application');
const Service = require('../models/Service');
const Testimonial = require('../models/Testimonial');
const Inquiry = require('../models/Inquiry');

// @desc  Get all payments (extracted from applications)
// @route GET /api/payments
const getPayments = async (req, res) => {
    try {
        const { startDate, endDate, status, method, search, page = 1, limit = 20 } = req.query;

        let query = {};

        if (status && status !== 'all') {
            const s = status.toLowerCase();
            if (s === 'pending_verification' || s === 'pending') {
                query['paymentDetails.paymentStatus'] = { $in: ['PENDING_VERIFICATION', 'Pending', 'pending', 'PAYMENT_PENDING'] };
            } else if (s === 'verified' || s === 'paid') {
                query['paymentDetails.paymentStatus'] = { $in: ['PAID', 'Paid'] };
            } else if (s === 'rejected' || s === 'failed') {
                query['paymentDetails.paymentStatus'] = { $in: ['REJECTED', 'Failed', 'failed'] };
            } else if (s === 'cash' || s === 'cash_at_counter') {
                query['paymentDetails.method'] = 'cash';
            } else if (s === 'utr_only') {
                query['paymentDetails.evidenceType'] = 'utr_only';
            } else if (s === 'screenshot_only') {
                query['paymentDetails.evidenceType'] = 'screenshot_only';
            } else if (s === 'both') {
                query['paymentDetails.evidenceType'] = 'both';
            } else {
                query['paymentDetails.paymentStatus'] = status;
            }
        }

        if (method && method !== 'all') {
            query['paymentDetails.method'] = method;
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
            .select('trackingId serviceName userDetails paymentDetails adminRemarks createdAt status');

        const payments = applications.map(app => {
            const rawStatus = app.paymentDetails?.paymentStatus || 'Pending';
            const date = app.paymentDetails?.paymentDate || app.createdAt;
            const pMethod = (app.paymentDetails?.method || 'upi').toLowerCase();
            const hasUtr = Boolean(app.paymentDetails?.transactionId && !app.paymentDetails?.transactionId.startsWith('CASH-') && !app.paymentDetails?.transactionId.startsWith('UPI-SS-'));
            const hasScreenshot = Boolean(app.paymentDetails?.screenshotUrl);

            let evidenceType = app.paymentDetails?.evidenceType;
            if (!evidenceType || evidenceType === 'none') {
                if (pMethod === 'cash') evidenceType = 'cash';
                else if (hasUtr && hasScreenshot) evidenceType = 'both';
                else if (hasScreenshot) evidenceType = 'screenshot_only';
                else if (hasUtr) evidenceType = 'utr_only';
                else evidenceType = 'none';
            }

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
                method: pMethod,
                transactionId: app.paymentDetails?.transactionId || 'N/A',
                screenshotUrl: app.paymentDetails?.screenshotUrl || '',
                evidenceType: evidenceType,
                status: rawStatus,
                paymentStatus: rawStatus,
                appStatus: app.status || 'received',
                verifiedBy: app.paymentDetails?.verifiedBy || '',
                verifiedAt: app.paymentDetails?.verifiedAt || null,
                rejectionReason: app.paymentDetails?.rejectionReason || '',
                adminRemarks: app.adminRemarks || app.paymentDetails?.adminRemark || '',
                auditLog: app.paymentDetails?.auditLog || [],
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

// @desc  Dashboard stats (100% Real data from MongoDB)
// @route GET /api/payments/stats
const getStats = async (req, res) => {
    try {
        const total = await Application.countDocuments();
        const totalServices = await Service.countDocuments();
        const pending = await Application.countDocuments({ status: 'received' });
        const reviewing = await Application.countDocuments({ status: 'review' });
        const verifying = await Application.countDocuments({ status: 'verifying' });
        const completed = await Application.countDocuments({ status: 'completed' });
        const rejected = await Application.countDocuments({ status: 'rejected' });

        // Applications received today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const newToday = await Application.countDocuments({ createdAt: { $gte: startOfToday } });

        // Total Paid Earnings (case-insensitive check for Paid/PAID)
        const earningsAgg = await Application.aggregate([
            { $match: { 'paymentDetails.paymentStatus': { $in: ['Paid', 'PAID', 'paid'] } } },
            { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
        ]);
        const totalEarnings = earningsAgg[0]?.total || 0;

        // Current Month Earnings
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const thisMonthAgg = await Application.aggregate([
            {
                $match: {
                    'paymentDetails.paymentStatus': { $in: ['Paid', 'PAID', 'paid'] },
                    createdAt: { $gte: startOfMonth }
                }
            },
            { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
        ]);
        const thisMonthEarnings = thisMonthAgg[0]?.total || 0;

        // Real Monthly Earnings for last 5 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const monthlyDataMap = {};
        for (let i = 4; i >= 0; i--) {
            const d = new Date(currentYear, currentMonth - i, 1);
            const mKey = `${d.getFullYear()}-${d.getMonth()}`;
            monthlyDataMap[mKey] = { m: months[d.getMonth()], v: 0, year: d.getFullYear(), month: d.getMonth() };
        }
        const fiveMonthsAgo = new Date(currentYear, currentMonth - 4, 1);
        const monthlyAgg = await Application.aggregate([
            {
                $match: {
                    'paymentDetails.paymentStatus': { $in: ['Paid', 'PAID', 'paid'] },
                    createdAt: { $gte: fiveMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $subtract: [{ $month: '$createdAt' }, 1] }
                    },
                    total: { $sum: '$paymentDetails.amount' }
                }
            }
        ]);
        monthlyAgg.forEach(item => {
            const key = `${item._id.year}-${item._id.month}`;
            if (monthlyDataMap[key]) {
                monthlyDataMap[key].v = item.total || 0;
            }
        });
        const monthlyEarnings = Object.values(monthlyDataMap);

        // Real Popular Services volume
        const serviceAgg = await Application.aggregate([
            { $match: { serviceName: { $exists: true, $ne: '' } } },
            { $group: { _id: '$serviceName', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        let popularServices = serviceAgg.map(s => ({ name: s._id, count: s.count }));
        if (popularServices.length === 0) {
            const actualServices = await Service.find({ isActive: { $ne: false } }).limit(5).select('title name');
            popularServices = actualServices.map(s => ({ name: s.title || s.name, count: 0 }));
        }

        // Real Recent Testimonials
        const recentTestimonials = await Testimonial.find().sort({ createdAt: -1 }).limit(3).select('name message createdAt');

        // Real Recent Inquiries/Messages
        const recentMessages = await Inquiry.find().sort({ createdAt: -1 }).limit(3).select('name message createdAt');

        // Real Success Rate calculation
        const processedTotal = completed + rejected;
        const successRate = processedTotal > 0 ? ((completed / processedTotal) * 100).toFixed(1) : '100';

        let recent = await Application.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .select('trackingId serviceName userDetails.fullName userDetails.mobile status createdAt paymentDetails.amount paymentDetails.paymentStatus documents');

        recent = recent.map(app => {
            const appObj = app.toObject();
            if (appObj.documents) {
                appObj.documents = appObj.documents.map(doc => ({
                    ...doc,
                    filePath: doc.filePath && doc.filePath.includes('uploads/')
                        ? doc.filePath.substring(doc.filePath.indexOf('uploads/'))
                        : (doc.filePath || '')
                }));
            }
            return appObj;
        });

        res.json({
            success: true,
            data: {
                total,
                totalServices,
                newToday,
                pending,
                reviewing,
                verifying,
                completed,
                rejected,
                totalEarnings,
                thisMonthEarnings,
                monthlyEarnings,
                popularServices,
                recentTestimonials,
                recentMessages,
                successRate,
                recent
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc  Update payment status (Verify / Reject with remarks / Mark cash received)
// @route PATCH /api/payments/:id/status
const updatePaymentStatus = async (req, res) => {
    try {
        const { action, status, adminRemarks, rejectionReason } = req.body;

        let app = await Application.findById(req.params.id);
        if (!app) {
            return res.status(404).json({ success: false, message: 'Application/Payment not found' });
        }

        if (!app.paymentDetails) {
            app.paymentDetails = {};
        }

        const adminUser = req.admin?.username || req.admin?.email || 'Admin';
        let newStatus = status;

        if (action === 'approve' || status === 'Paid' || status === 'PAID') {
            newStatus = 'PAID';
            app.paymentDetails.paymentStatus = 'PAID';
            app.paymentDetails.verifiedBy = adminUser;
            app.paymentDetails.verifiedAt = new Date();
            app.paymentDetails.rejectionReason = undefined;
            if (app.status === 'received') {
                app.status = 'review';
            }
        } else if (action === 'reject' || status === 'REJECTED' || status === 'Failed') {
            newStatus = 'REJECTED';
            app.paymentDetails.paymentStatus = 'REJECTED';
            app.paymentDetails.rejectionReason = rejectionReason || adminRemarks || 'Invalid payment reference or screenshot.';
            app.paymentDetails.verifiedBy = adminUser;
            app.paymentDetails.verifiedAt = new Date();
        } else if (action === 'mark_cash_received') {
            newStatus = 'PAID';
            app.paymentDetails.paymentStatus = 'PAID';
            app.paymentDetails.method = 'cash';
            app.paymentDetails.verifiedBy = adminUser;
            app.paymentDetails.verifiedAt = new Date();
            if (app.status === 'received') {
                app.status = 'review';
            }
        } else if (action === 'request_evidence') {
            newStatus = 'PENDING_VERIFICATION';
            app.paymentDetails.paymentStatus = 'PENDING_VERIFICATION';
            app.paymentDetails.adminRemark = adminRemarks || 'Please submit updated payment reference / screenshot.';
        } else if (status) {
            app.paymentDetails.paymentStatus = status;
        }

        if (adminRemarks !== undefined) {
            app.paymentDetails.adminRemark = adminRemarks;
            app.adminRemarks = adminRemarks;
        }

        // Add to auditLog
        if (!app.paymentDetails.auditLog) {
            app.paymentDetails.auditLog = [];
        }
        app.paymentDetails.auditLog.push({
            action: action ? action.toUpperCase() : `STATUS_SET_${newStatus}`,
            performedBy: adminUser,
            timestamp: new Date(),
            note: adminRemarks || rejectionReason || `Status updated to ${newStatus}`
        });

        await app.save();

        res.json({
            success: true,
            message: `Payment status successfully updated to ${newStatus}`,
            data: {
                _id: app._id,
                trackingId: app.trackingId,
                status: app.paymentDetails.paymentStatus,
                paymentStatus: app.paymentDetails.paymentStatus,
                verifiedBy: app.paymentDetails.verifiedBy,
                verifiedAt: app.paymentDetails.verifiedAt,
                rejectionReason: app.paymentDetails.rejectionReason,
                adminRemarks: app.adminRemarks
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getPayments, exportPayments, getStats, updatePaymentStatus };
