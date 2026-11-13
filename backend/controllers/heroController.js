const HeroSlide = require('../models/HeroSlide');
const LiveNotice = require('../models/LiveNotice');
const NoticeSettings = require('../models/NoticeSettings');
const path = require('path');
const fs = require('fs');

// ── Hero Slides ─────────────────────────────────────────────────────────────

const getSlides = async (req, res) => {
    try {
        const slides = await HeroSlide.find({}).sort({ order: 1 });
        res.json({ success: true, data: slides });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getActiveSlides = async (req, res) => {
    try {
        const slides = await HeroSlide.find({ active: true }).sort({ order: 1 });
        res.json({ success: true, data: slides });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createSlide = async (req, res) => {
    try {
        const { title, subtitle, badge, buttonText, buttonLink, order, imageBase64, image: imageUrl } = req.body;
        let slideImage = imageBase64 || imageUrl || req.body.image;

        if (!slideImage && req.file) {
            try {
                const fileData = fs.readFileSync(req.file.path);
                slideImage = `data:${req.file.mimetype || 'image/jpeg'};base64,${fileData.toString('base64')}`;
            } catch (err) {
                slideImage = `/uploads/hero/${req.file.filename}`;
            }
        }

        if (!slideImage) return res.status(400).json({ success: false, message: 'Image or Image URL is required' });

        const slide = await HeroSlide.create({
            title: title || '',
            subtitle: subtitle || '',
            badge: badge || '',
            buttonText: buttonText || '',
            buttonLink: buttonLink || '',
            order: order !== undefined ? Number(order) : 0,
            image: slideImage
        });

        res.status(201).json({ success: true, data: slide });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateSlide = async (req, res) => {
    try {
        const { title, subtitle, badge, buttonText, buttonLink, order, active, imageBase64, image: imageUrl } = req.body;
        const slide = await HeroSlide.findById(req.params.id);
        if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });

        if (title !== undefined) slide.title = title;
        if (subtitle !== undefined) slide.subtitle = subtitle;
        if (badge !== undefined) slide.badge = badge;
        if (buttonText !== undefined) slide.buttonText = buttonText;
        if (buttonLink !== undefined) slide.buttonLink = buttonLink;
        if (order !== undefined) slide.order = Number(order);
        if (active !== undefined) slide.active = active;

        let slideImage = imageBase64 || imageUrl;
        if (!slideImage && req.file) {
            try {
                const fileData = fs.readFileSync(req.file.path);
                slideImage = `data:${req.file.mimetype || 'image/jpeg'};base64,${fileData.toString('base64')}`;
            } catch (err) {
                slideImage = `/uploads/hero/${req.file.filename}`;
            }
        } else if (!slideImage && req.body.image) {
            slideImage = req.body.image;
        }

        if (slideImage) {
            slide.image = slideImage;
        }

        const updated = await slide.save();
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteSlide = async (req, res) => {
    try {
        const slide = await HeroSlide.findById(req.params.id);
        if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });

        if (slide.image && slide.image.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, '..', slide.image);
            if (fs.existsSync(imagePath)) {
                try { fs.unlinkSync(imagePath); } catch (e) {}
            }
        }

        await slide.deleteOne();
        res.json({ success: true, message: 'Slide deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Live Notices ─────────────────────────────────────────────────────────────

const getNotices = async (req, res) => {
    try {
        const notices = await LiveNotice.find({}).sort({ order: 1, createdAt: -1 });
        res.json({ success: true, data: notices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getActiveNotices = async (req, res) => {
    try {
        const now = new Date();
        const notices = await LiveNotice.find({
            $or: [
                { status: true },
                { status: { $exists: false } },
                { active: true }
            ],
            $and: [
                {
                    $or: [
                        { startDate: null },
                        { startDate: { $exists: false } },
                        { startDate: { $lte: now } }
                    ]
                },
                {
                    $or: [
                        { isLifetime: true },
                        { expiryDate: null },
                        { expiryDate: { $exists: false } },
                        { expiryDate: { $gt: now } }
                    ]
                }
            ]
        }).sort({ order: 1, createdAt: -1 });
        res.json({ success: true, data: notices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createNotice = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.iconImage = `/uploads/hero/${req.file.filename}`;
            data.iconType = 'image';
        }
        if (data.isLifetime === 'true' || data.isLifetime === true) {
            data.isLifetime = true;
            data.expiryDate = null;
        } else if (data.isLifetime === 'false') {
            data.isLifetime = false;
        }
        if (data.status === 'true') data.status = true;
        if (data.status === 'false') data.status = false;
        if (data.order !== undefined) data.order = Number(data.order);
        if (data.startDate === '') data.startDate = null;
        if (data.expiryDate === '') data.expiryDate = null;
        const notice = await LiveNotice.create(data);
        res.status(201).json({ success: true, data: notice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateNotice = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.iconImage = `/uploads/hero/${req.file.filename}`;
            data.iconType = 'image';
        }
        if (data.isLifetime === 'true' || data.isLifetime === true) {
            data.isLifetime = true;
            data.expiryDate = null;
        } else if (data.isLifetime === 'false') {
            data.isLifetime = false;
        }
        if (data.status === 'true') data.status = true;
        if (data.status === 'false') data.status = false;
        if (data.order !== undefined) data.order = Number(data.order);
        if (data.startDate === '') data.startDate = null;
        if (data.expiryDate === '') data.expiryDate = null;
        const notice = await LiveNotice.findByIdAndUpdate(req.params.id, data, { new: true });
        if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
        res.json({ success: true, data: notice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteNotice = async (req, res) => {
    try {
        const notice = await LiveNotice.findByIdAndDelete(req.params.id);
        if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
        res.json({ success: true, message: 'Notice deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const duplicateNotice = async (req, res) => {
    try {
        const original = await LiveNotice.findById(req.params.id);
        if (!original) return res.status(404).json({ success: false, message: 'Notice not found' });
        const copyData = original.toObject();
        delete copyData._id;
        delete copyData.createdAt;
        delete copyData.updatedAt;
        copyData.title = `${copyData.title} (Copy)`;
        copyData.order = (original.order || 0) + 1;
        const duplicated = await LiveNotice.create(copyData);
        res.status(201).json({ success: true, data: duplicated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Notice Settings (Animation & Display) ────────────────────────────────────

const getNoticeSettings = async (req, res) => {
    try {
        let settings = await NoticeSettings.findOne();
        if (!settings) {
            settings = await NoticeSettings.create({});
        }
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateNoticeSettings = async (req, res) => {
    try {
        let settings = await NoticeSettings.findOne();
        if (!settings) {
            settings = new NoticeSettings();
        }
        Object.assign(settings, req.body);
        await settings.save();
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getSlides, getActiveSlides, createSlide, updateSlide, deleteSlide,
    getNotices, getActiveNotices, createNotice, updateNotice, deleteNotice,
    duplicateNotice, getNoticeSettings, updateNoticeSettings
};
