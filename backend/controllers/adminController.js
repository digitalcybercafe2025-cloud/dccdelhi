const Admin = require('../models/Admin');
const Settings = require('../models/Settings');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const sanitizeText = (val) => String(val || '').replace(/[<>]/g, '').trim();
const isValidMobile = (m) => /^[6-9]\d{9}$/.test(String(m || '').trim());
const isValidPin = (p) => /^\d{6}$/.test(String(p || '').trim());
const isStrongPassword = (pwd) => {
    const s = String(pwd || '');
    return s.length >= 8 && /[A-Za-z]/.test(s) && /\d/.test(s);
};

const timingSafeEqualStr = (a, b) => {
    const bufA = Buffer.from(String(a || ''), 'utf8');
    const bufB = Buffer.from(String(b || ''), 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
};

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

// @desc    Auth admin & get token (supports Email, Admin ID, or Registered Mobile)
// @route   POST /api/admin/login
// @access  Public
const authAdmin = async (req, res) => {
    const rawIdentifier = String(req.body.identifier || req.body.email || '').trim();
    const password = String(req.body.password || '');

    if (!rawIdentifier || !password) {
        return res.status(400).json({ message: 'Mobile Number / Admin ID and password are required' });
    }

    try {
        const escaped = rawIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const admin = await Admin.findOne({
            $or: [
                { email: { $regex: new RegExp(`^${escaped}$`, 'i') } },
                { mobile: rawIdentifier }
            ]
        }).select('+recoveryPin');

        if (admin && admin.lockUntil && admin.lockUntil > Date.now()) {
            const minsLeft = Math.ceil((admin.lockUntil - Date.now()) / 60000);
            return res.status(429).json({
                message: `Account temporarily locked due to multiple failed attempts. Try again in ${minsLeft} minute(s).`
            });
        }

        if (admin && (await admin.matchPassword(password))) {
            if (admin.failedLoginAttempts > 0 || admin.lockUntil) {
                await Admin.updateOne(
                    { _id: admin._id },
                    { $set: { failedLoginAttempts: 0, lockUntil: null } }
                );
            }

            return res.json({
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                mobile: admin.mobile || '',
                role: admin.role,
                avatar: admin.avatar,
                hasRecoveryPin: Boolean(admin.recoveryPin),
                token: generateToken(admin._id)
            });
        }

        if (admin) {
            const nextAttempts = (admin.failedLoginAttempts || 0) + 1;
            const updateFields = { failedLoginAttempts: nextAttempts };
            if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
                updateFields.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
            }
            await Admin.updateOne({ _id: admin._id }, { $set: updateFields });
        }

        return res.status(401).json({ message: 'Invalid credentials. Please check your ID/Mobile and Password.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Self Sign-Up for Staff with Security Invite Code & 6-digit Recovery PIN (No OTP)
// @route   POST /api/admin/signup
// @access  Public (Guarded by Admin Security Invite Code + Rate Limit)
const signupWithCode = async (req, res) => {
    try {
        const name = sanitizeText(req.body.name);
        const mobile = String(req.body.mobile || '').trim();
        const rawEmail = sanitizeText(req.body.email);
        const password = String(req.body.password || '');
        const recoveryPin = String(req.body.recoveryPin || '').trim();
        const securityCode = String(req.body.securityCode || '').trim();

        if (!name || name.length < 2) {
            return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
        }
        if (!isValidMobile(mobile)) {
            return res.status(400).json({ message: 'Please enter a valid 10-digit Indian mobile number.' });
        }
        if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }
        if (!isStrongPassword(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters and include both letters and numbers.' });
        }
        if (!isValidPin(recoveryPin)) {
            return res.status(400).json({ message: 'Secret Recovery PIN must be exactly 6 numeric digits.' });
        }
        if (!securityCode) {
            return res.status(400).json({ message: 'Security Invite Code is required to register.' });
        }

        // Verify Security Invite Code (from Settings DB hash or environment variable)
        const settings = await Settings.findOne().select('+adminInviteCodeHash');
        const envInviteCode = process.env.ADMIN_INVITE_CODE ? String(process.env.ADMIN_INVITE_CODE).trim() : '';

        let isInviteValid = false;
        if (settings && settings.adminInviteCodeHash) {
            isInviteValid = await bcrypt.compare(securityCode, settings.adminInviteCodeHash);
        } else if (envInviteCode) {
            isInviteValid = timingSafeEqualStr(securityCode, envInviteCode);
        } else {
            return res.status(403).json({
                message: 'Team Sign-Up Security Code is not configured yet. Ask the Super Admin to set it in Admin Settings → Security Access.'
            });
        }

        if (!isInviteValid) {
            return res.status(403).json({ message: 'Invalid Security Invite Code. Access denied.' });
        }

        const finalEmail = rawEmail || mobile;
        const escapedEmail = finalEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existing = await Admin.findOne({
            $or: [
                { mobile },
                { email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } },
                { email: mobile }
            ]
        });

        if (existing) {
            return res.status(400).json({ message: 'An account with this mobile number or email already exists.' });
        }

        const newStaff = await Admin.create({
            name,
            mobile,
            email: finalEmail,
            password,
            recoveryPin,
            role: 'staff'
        });

        return res.status(201).json({
            _id: newStaff._id,
            name: newStaff.name,
            email: newStaff.email,
            mobile: newStaff.mobile,
            role: newStaff.role,
            avatar: newStaff.avatar,
            hasRecoveryPin: true,
            token: generateToken(newStaff._id)
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Step 1 of Forgot Password: Verify Registered Mobile + 6-digit Secret Recovery PIN
// @route   POST /api/admin/forgot-password/verify
// @access  Public (Strictly Rate Limited & Brute-force Locked)
const verifyRecoveryPin = async (req, res) => {
    try {
        const mobile = String(req.body.mobile || '').trim();
        const recoveryPin = String(req.body.recoveryPin || '').trim();

        if (!/^\d{10}$/.test(mobile)) {
            return res.status(400).json({ message: 'Please enter your registered 10-digit mobile number.' });
        }
        if (!isValidPin(recoveryPin)) {
            return res.status(400).json({ message: 'Please enter your 6-digit Secret Recovery PIN.' });
        }

        const admin = await Admin.findOne({
            $or: [{ mobile }, { email: mobile }]
        }).select('+recoveryPin');

        if (!admin) {
            return res.status(401).json({ message: 'Invalid Mobile Number or Secret Recovery PIN.' });
        }

        if (admin.recoveryLockUntil && admin.recoveryLockUntil > Date.now()) {
            const minsLeft = Math.ceil((admin.recoveryLockUntil - Date.now()) / 60000);
            return res.status(429).json({
                message: `Recovery locked after too many wrong PIN attempts. Try again in ${minsLeft} minute(s).`
            });
        }

        if (!admin.recoveryPin) {
            return res.status(400).json({
                message: 'Secret Recovery PIN is not set for this account yet. Contact the Super Admin to reset or set your PIN in Settings.'
            });
        }

        const isMatch = await admin.matchRecoveryPin(recoveryPin);
        if (!isMatch) {
            const nextAttempts = (admin.failedRecoveryAttempts || 0) + 1;
            const updateFields = { failedRecoveryAttempts: nextAttempts };
            if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
                updateFields.recoveryLockUntil = new Date(Date.now() + LOCK_DURATION_MS);
            }
            await Admin.updateOne({ _id: admin._id }, { $set: updateFields });

            if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
                return res.status(429).json({
                    message: 'Too many wrong Recovery PIN attempts. Password recovery locked for 15 minutes.'
                });
            }

            const remaining = MAX_FAILED_ATTEMPTS - nextAttempts;
            return res.status(401).json({
                message: `Invalid Mobile Number or Secret Recovery PIN. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`
            });
        }

        await Admin.updateOne(
            { _id: admin._id },
            { $set: { failedRecoveryAttempts: 0, recoveryLockUntil: null } }
        );

        const resetToken = jwt.sign(
            { id: admin._id, purpose: 'pwd_reset' },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        return res.json({
            success: true,
            resetToken,
            accountName: admin.name || 'Admin'
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Step 2 of Forgot Password: Reset Password using signed resetToken
// @route   POST /api/admin/forgot-password/reset
// @access  Public (Requires valid 5-minute signed resetToken)
const resetPasswordWithToken = async (req, res) => {
    try {
        const resetToken = String(req.body.resetToken || '').trim();
        const newPassword = String(req.body.newPassword || '');

        if (!resetToken) {
            return res.status(400).json({ message: 'Reset session missing. Please verify your Mobile and PIN again.' });
        }
        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({ message: 'New password must be at least 8 characters and include both letters and numbers.' });
        }

        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Reset session expired or invalid. Please verify your PIN again.' });
        }

        if (!decoded || decoded.purpose !== 'pwd_reset' || !decoded.id) {
            return res.status(401).json({ message: 'Invalid reset authorization token.' });
        }

        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(404).json({ message: 'Account not found.' });
        }

        admin.password = newPassword;
        admin.failedLoginAttempts = 0;
        admin.lockUntil = null;
        admin.failedRecoveryAttempts = 0;
        admin.recoveryLockUntil = null;
        await admin.save();

        return res.json({
            success: true,
            message: 'Password updated successfully! You can now sign in with your new password.'
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Register a new admin (Protected: only existing admin can create new staff/admin)
// @route   POST /api/admin/register
// @access  Private/Admin
const registerAdmin = async (req, res) => {
    const email = sanitizeText(req.body.email);
    const password = String(req.body.password || '');
    const name = sanitizeText(req.body.name);
    const mobile = req.body.mobile ? String(req.body.mobile).trim() : undefined;
    const role = req.body.role === 'admin' ? 'admin' : 'staff';

    try {
        const adminExists = await Admin.findOne({ email });

        if (adminExists) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const admin = await Admin.create({
            email,
            password,
            mobile,
            role,
            name: name || 'Admin'
        });

        if (admin) {
            res.status(201).json({
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                mobile: admin.mobile || '',
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
        const admin = await Admin.findById(req.admin._id).select('-password +recoveryPin');
        if (!admin) return res.status(404).json({ message: 'Admin not found' });
        res.json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            mobile: admin.mobile || '',
            role: admin.role,
            avatar: admin.avatar,
            hasRecoveryPin: Boolean(admin.recoveryPin),
            createdAt: admin.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update admin profile (including mobile & 6-digit recovery PIN)
// @route   PUT /api/admin/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id).select('+recoveryPin');
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        const { name, email, mobile, currentPassword, newPassword, newRecoveryPin } = req.body;

        const cleanName = name !== undefined ? sanitizeText(name) : undefined;
        const cleanEmail = email !== undefined ? sanitizeText(email) : undefined;
        const cleanMobile = mobile !== undefined ? String(mobile).trim() : undefined;
        const cleanPin = newRecoveryPin !== undefined ? String(newRecoveryPin).trim() : undefined;

        const sensitiveChange =
            (cleanEmail && cleanEmail !== admin.email) ||
            (cleanMobile !== undefined && cleanMobile !== (admin.mobile || '')) ||
            Boolean(newPassword) ||
            Boolean(cleanPin);

        if (sensitiveChange) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required to update credentials or security PIN.' });
            }
            const isMatch = await admin.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect.' });
            }
        }

        if (cleanName) admin.name = cleanName;

        if (cleanEmail && cleanEmail !== admin.email) {
            const emailExists = await Admin.findOne({ email: cleanEmail, _id: { $ne: admin._id } });
            if (emailExists) {
                return res.status(400).json({ message: 'Login ID / Email already in use.' });
            }
            admin.email = cleanEmail;
        }

        if (cleanMobile !== undefined && cleanMobile !== '') {
            if (!/^\d{10}$/.test(cleanMobile)) {
                return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
            }
            const mobileExists = await Admin.findOne({ mobile: cleanMobile, _id: { $ne: admin._id } });
            if (mobileExists) {
                return res.status(400).json({ message: 'Mobile number already registered to another account.' });
            }
            admin.mobile = cleanMobile;
        }

        if (newPassword) {
            if (!isStrongPassword(newPassword)) {
                return res.status(400).json({ message: 'New password must be at least 8 characters with letters and numbers.' });
            }
            admin.password = newPassword;
        }

        if (cleanPin) {
            if (!isValidPin(cleanPin)) {
                return res.status(400).json({ message: 'Recovery PIN must be exactly 6 numeric digits.' });
            }
            admin.recoveryPin = cleanPin;
        }

        const updated = await admin.save();

        res.json({
            _id: updated._id,
            name: updated.name,
            email: updated.email,
            mobile: updated.mobile || '',
            role: updated.role,
            avatar: updated.avatar,
            hasRecoveryPin: Boolean(updated.recoveryPin),
            token: generateToken(updated._id)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Get Admin security configuration status (booleans only, zero secrets)
// @route   GET /api/admin/security-config
// @access  Private/Admin
const getSecurityConfig = async (req, res) => {
    try {
        const [settings, admin] = await Promise.all([
            Settings.findOne().select('+adminInviteCodeHash'),
            Admin.findById(req.admin._id).select('+recoveryPin')
        ]);
        return res.json({
            hasInviteCode: Boolean((settings && settings.adminInviteCodeHash) || process.env.ADMIN_INVITE_CODE),
            hasRecoveryPin: Boolean(admin && admin.recoveryPin)
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Set/Update Team Sign-Up Security Invite Code (hashed in DB)
// @route   PUT /api/admin/security-config
// @access  Private/Admin
const updateSecurityConfig = async (req, res) => {
    try {
        const inviteCode = String(req.body.inviteCode || '').trim();
        const currentPassword = String(req.body.currentPassword || '');

        if (!currentPassword) {
            return res.status(400).json({ message: 'Current admin password is required to change the Security Invite Code.' });
        }
        if (!inviteCode || inviteCode.length < 6) {
            return res.status(400).json({ message: 'Security Invite Code must be at least 6 characters.' });
        }

        const admin = await Admin.findById(req.admin._id);
        if (!admin || !(await admin.matchPassword(currentPassword))) {
            return res.status(401).json({ message: 'Current password is incorrect.' });
        }

        let settings = await Settings.findOne().select('+adminInviteCodeHash');
        if (!settings) settings = new Settings();

        const salt = await bcrypt.genSalt(10);
        settings.adminInviteCodeHash = await bcrypt.hash(inviteCode, salt);
        await settings.save();

        return res.json({
            success: true,
            hasInviteCode: true,
            message: 'Team Sign-Up Security Code updated securely.'
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error: ' + error.message });
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

        const { name, email, mobile, role, password } = req.body;

        if (name) admin.name = sanitizeText(name);
        if (email) admin.email = sanitizeText(email);
        if (mobile !== undefined) admin.mobile = String(mobile).trim();
        if (role) admin.role = role;
        if (password) admin.password = password;

        const updated = await admin.save();
        res.json({
            _id: updated._id,
            name: updated.name,
            email: updated.email,
            mobile: updated.mobile || '',
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

module.exports = {
    authAdmin,
    signupWithCode,
    verifyRecoveryPin,
    resetPasswordWithToken,
    registerAdmin,
    getProfile,
    updateProfile,
    getSecurityConfig,
    updateSecurityConfig,
    uploadAvatar,
    avatarUpload,
    getAllAdmins,
    updateAdmin,
    deleteAdmin
};
