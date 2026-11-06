const Testimonial = require('../models/Testimonial');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage for testimonial images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/testimonials');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `testimonial-${Date.now()}${ext}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// @desc  Get active testimonials (public)
// @route GET /api/testimonials
const getTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find({ active: true }).sort({ order: 1, createdAt: -1 });
        res.json({ success: true, data: testimonials });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc  Get ALL testimonials (admin)
// @route GET /api/testimonials/all
const getAllTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find({}).sort({ order: 1, createdAt: -1 });
        res.json({ success: true, data: testimonials });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc  Create testimonial
// @route POST /api/testimonials
const createTestimonial = async (req, res) => {
    try {
        const { name, role, message, rating, order, image, imageBase64 } = req.body;
        let imageUrl = imageBase64 || image || '';
        if (req.file) {
            try {
                const fileData = fs.readFileSync(req.file.path);
                imageUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${fileData.toString('base64')}`;
            } catch (e) {
                imageUrl = `/uploads/testimonials/${req.file.filename}`;
            }
        }
        const testimonial = await Testimonial.create({
            name,
            role: role || 'Customer',
            message,
            rating: rating !== undefined ? Number(rating) : 5,
            order: order !== undefined ? Number(order) : 0,
            image: imageUrl
        });
        res.status(201).json({ success: true, data: testimonial });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc  Update testimonial
// @route PUT /api/testimonials/:id
const updateTestimonial = async (req, res) => {
    try {
        const { name, role, message, rating, order, active, image, imageBase64 } = req.body;
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) return res.status(404).json({ success: false, message: 'Not found' });

        let imageUrl = imageBase64 || (image !== undefined ? image : testimonial.image);
        if (req.file) {
            try {
                const fileData = fs.readFileSync(req.file.path);
                imageUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${fileData.toString('base64')}`;
            } catch (e) {
                imageUrl = `/uploads/testimonials/${req.file.filename}`;
            }
        }

        testimonial.name = name || testimonial.name;
        testimonial.role = role || testimonial.role;
        testimonial.message = message || testimonial.message;
        testimonial.rating = rating !== undefined ? Number(rating) : testimonial.rating;
        testimonial.order = order !== undefined ? Number(order) : testimonial.order;
        if (active !== undefined) {
            testimonial.active = (active === 'true' || active === true);
        }
        testimonial.image = imageUrl;

        const updated = await testimonial.save();
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc  Toggle active
// @route PATCH /api/testimonials/:id/toggle
const toggleActive = async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) return res.status(404).json({ success: false, message: 'Not found' });
        testimonial.active = !testimonial.active;
        await testimonial.save();
        res.json({ success: true, data: testimonial });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc  Delete testimonial
// @route DELETE /api/testimonials/:id
const deleteTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) return res.status(404).json({ success: false, message: 'Not found' });
        await testimonial.deleteOne();
        res.json({ success: true, message: 'Testimonial deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getTestimonials,
    getAllTestimonials,
    createTestimonial,
    updateTestimonial,
    toggleActive,
    deleteTestimonial,
    upload
};
