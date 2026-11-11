const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        default: 'Admin',
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    mobile: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: true
    },
    recoveryPin: {
        type: String,
        select: false
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    failedRecoveryAttempts: {
        type: Number,
        default: 0
    },
    recoveryLockUntil: {
        type: Date,
        default: null
    },
    role: {
        type: String,
        enum: ['admin', 'staff'],
        default: 'admin'
    },
    avatar: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Match password
adminSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password || !enteredPassword) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

// Match 6-digit recovery PIN
adminSchema.methods.matchRecoveryPin = async function (enteredPin) {
    if (!this.recoveryPin || !enteredPin) return false;
    return await bcrypt.compare(String(enteredPin), this.recoveryPin);
};

// Encrypt password & recoveryPin using bcrypt when modified
adminSchema.pre('save', async function (next) {
    try {
        if (this.isModified('password') && this.password) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
        if (this.isModified('recoveryPin') && this.recoveryPin) {
            const salt = await bcrypt.genSalt(10);
            this.recoveryPin = await bcrypt.hash(String(this.recoveryPin), salt);
        }
        return next();
    } catch (err) {
        return next(err);
    }
});

module.exports = mongoose.model('Admin', adminSchema);
