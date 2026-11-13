const mongoose = require('mongoose');

const liveNoticeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    type: { type: String, default: 'Important' }, // Important, Special, Alert, Festival, Scheme, Offer
    badge: { type: String, default: 'LIVE' },
    icon: { type: String, default: 'Zap' }, // Lucide icon or emoji
    iconType: { type: String, enum: ['emoji', 'lucide', 'image'], default: 'emoji' },
    iconImage: { type: String }, // uploaded image URL
    status: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    priority: { type: String, enum: ['High', 'Normal', 'Low'], default: 'Normal' },
    startDate: { type: Date },
    expiryDate: { type: Date },
    isLifetime: { type: Boolean, default: false },
    actionText: { type: String }, // e.g. "Apply Now"
    actionUrl: { type: String }, // e.g. "/apply/..."
}, { timestamps: true });

module.exports = mongoose.model('LiveNotice', liveNoticeSchema);
