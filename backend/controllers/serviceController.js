const Service = require('../models/Service');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage for service images
const serviceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/services');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `service-${Date.now()}${ext}`);
    }
});

const serviceUpload = multer({
    storage: serviceStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) cb(null, true);
        else cb(new Error('Only image files allowed'));
    }
});

// @desc    Get all services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
    try {
        const services = await Service.find({ active: true }).sort({ priority: -1 });
        res.status(200).json({ success: true, count: services.length, data: services });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get ALL services including inactive (admin)
// @route   GET /api/services/all
// @access  Private
const getAllServices = async (req, res) => {
    try {
        const services = await Service.find({}).sort({ priority: -1 });
        res.status(200).json({ success: true, count: services.length, data: services });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res) => {
    try {
        let service = null;
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            service = await Service.findById(req.params.id);
        }
        if (!service) {
            // Try title or normalized slug match
            const cleaned = req.params.id.replace(/[-_]/g, ' ');
            service = await Service.findOne({
                title: { $regex: new RegExp(`^${cleaned}$`, 'i') }
            });
        }
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }
        res.status(200).json({ success: true, data: service });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Create new service
// @route   POST /api/services
// @access  Private (Admin)
const createService = async (req, res) => {
    try {
        const serviceData = { ...req.body };
        if (req.file) {
            serviceData.image = `/uploads/services/${req.file.filename}`;
        }

        // Handle requiredDocs if it comes as a comma-separated string
        if (serviceData.requiredDocs && typeof serviceData.requiredDocs === 'string') {
            serviceData.requiredDocs = serviceData.requiredDocs.split(',').map(d => d.trim()).filter(Boolean);
        }

        const service = await Service.create(serviceData);
        res.status(201).json({ success: true, data: service });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Invalid data', error: error.message });
    }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (Admin)
const updateService = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) {
            updateData.image = `/uploads/services/${req.file.filename}`;
        }

        // Handle requiredDocs if it comes as a comma-separated string
        if (updateData.requiredDocs && typeof updateData.requiredDocs === 'string') {
            updateData.requiredDocs = updateData.requiredDocs.split(',').map(d => d.trim()).filter(Boolean);
        }

        const service = await Service.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }
        res.status(200).json({ success: true, data: service });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Invalid data', error: error.message });
    }
};

// @desc    Toggle service active status
// @route   PATCH /api/services/:id/toggle
// @access  Private (Admin)
const toggleService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
        service.active = !service.active;
        await service.save();
        res.status(200).json({ success: true, data: service });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Admin)
const deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }
        res.status(200).json({ success: true, message: 'Service deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getServices,
    getAllServices,
    getServiceById,
    createService,
    updateService,
    toggleService,
    deleteService,
    serviceUpload
};
