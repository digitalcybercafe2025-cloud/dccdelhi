const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// Multer storage for admin avatars
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/avatars');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${Date.now()}${ext}`);
    }
});
const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) cb(null, true);
        else cb(new Error('Only image files allowed'));
    }
});

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
const authAdmin = async (req, res) => {
    const cleanEmail = String(req.body.email || '').trim();
    const password = String(req.body.password || '');

    if (!cleanEmail || !password) {
        return res.status(400).json({ message: 'Admin ID/Email and password are required' });
    }

    try {
        const escaped = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const admin = await Admin.findOne({ email: { $regex: new RegExp(`^${escaped}$`, 'i') } });

        if (admin && (await admin.matchPassword(password))) {
            res.json({
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                avatar: admin.avatar,
                token: generateToken(admin._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Register a new admin (Initial setup usually)
// @route   POST /api/admin/register
// @access  Protected (only existing admin can create new staff/admin)
const registerAdmin = async (req, res) => {
    const { email, password, name } = req.body;

    try {
        const adminExists = await Admin.findOne({ email });

        if (adminExists) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const admin = await Admin.create({
            email,
            password,
            name: name || 'Admin'
        });

        if (admin) {
            res.status(201).json({
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                token: generateToken(admin._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid admin data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id).select('-password');
        if (!admin) return res.status(404).json({ message: 'Admin not found' });
        res.json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            avatar: admin.avatar,
            createdAt: admin.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id);
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        const { name, email, currentPassword, newPassword } = req.body;

        // Update name
        if (name) admin.name = name;

        // Update email (check uniqueness)
        if (email && email !== admin.email) {
            const emailExists = await Admin.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            admin.email = email;
        }

        // Update password (requires current password verification)
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password required to set new password' });
            }
            const isMatch = await admin.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
            admin.password = newPassword;
        }

        const updated = await admin.save();

        res.json({
            _id: updated._id,
            name: updated.name,
            email: updated.email,
            role: updated.role,
            avatar: updated.avatar,
            token: generateToken(updated._id)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Upload admin avatar
// @route   POST /api/admin/upload-avatar
// @access  Private
const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const admin = await Admin.findById(req.admin._id);
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        // Delete old avatar file if exists and it's a local file
        if (admin.avatar && admin.avatar.startsWith('/uploads/')) {
            const oldPath = path.join(__dirname, '..', admin.avatar);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        admin.avatar = `/uploads/avatars/${req.file.filename}`;
        await admin.save();

        res.json({ success: true, avatar: admin.avatar });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Get all admins/staff
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find({}).select('-password');
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update an admin/staff (by authorized admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateAdmin = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        const { name, email, role, password } = req.body;

        if (name) admin.name = name;
        if (email) admin.email = email;
        if (role) admin.role = role;
        if (password) admin.password = password;

        const updated = await admin.save();
        res.json({
            _id: updated._id,
            name: updated.name,
            email: updated.email,
            role: updated.role,
            avatar: updated.avatar
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Delete an admin/staff
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteAdmin = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        // Prevent deleting self
        if (admin._id.toString() === req.admin._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await admin.deleteOne();
        res.json({ message: 'Admin removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

module.exports = { authAdmin, registerAdmin, getProfile, updateProfile, uploadAvatar, avatarUpload, getAllAdmins, updateAdmin, deleteAdmin };
