const mongoose = require('mongoose');

const liveNoticeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['Important', 'Special', 'Alert'], default: 'Important' },
    badge: { type: String, default: 'LIVE' },
    icon: { type: String, default: 'Zap' },
    status: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    expiryDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('LiveNotice', liveNoticeSchema);
