const Inquiry = require('../models/Inquiry');
const Notification = require('../models/Notification');

// @desc    Create a new inquiry
// @route   POST /api/inquiries
// @access  Public
const createInquiry = async (req, res) => {
    try {
        const { name, mobile, email, message } = req.body;

        if (!name || !mobile) {
            return res.status(400).json({
                success: false,
                message: 'Name and Mobile Number are required'
            });
        }

        const inquiry = await Inquiry.create({
            name,
            mobile,
            email,
            message
        });

        // Simultaneously create an admin notification
        await Notification.create({
            type: 'contact',
            userName: name,
            email,
            mobile,
            message
        });

        res.status(201).json({
            success: true,
            data: inquiry,
            message: 'Inquiry submitted successfully'
        });
    } catch (error) {
        console.error('Error creating inquiry:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get all inquiries
// @route   GET /api/inquiries
// @access  Private (Admin)
const getInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: inquiries
        });
    } catch (error) {
        console.error('Error fetching inquiries:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Update inquiry status
// @route   PUT /api/inquiries/:id
// @access  Private (Admin)
const updateInquiryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const inquiry = await Inquiry.findById(req.params.id);

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                message: 'Inquiry not found'
            });
        }

        inquiry.status = status || inquiry.status;
        await inquiry.save();

        res.status(200).json({
            success: true,
            data: inquiry,
            message: 'Inquiry updated successfully'
        });
    } catch (error) {
        console.error('Error updating inquiry:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

module.exports = {
    createInquiry,
    getInquiries,
    updateInquiryStatus
};
