const mongoose = require('mongoose');

const noticeSettingsSchema = new mongoose.Schema({
    visibleCount: { type: Number, default: 2, min: 2, max: 6 },
    autoAnimation: { type: Boolean, default: true },
    animationType: {
        type: String,
        enum: ['scroll', 'fade', 'slide', 'fade-slide', 'instant'],
        default: 'scroll'
    },
    animationDirection: {
        type: String,
        enum: ['up', 'down', 'left', 'right'],
        default: 'up'
    },
    animationSpeed: {
        type: String,
        enum: ['slow', 'normal', 'fast', 'custom'],
        default: 'normal'
    },
    animationDuration: { type: Number, default: 600 }, // ms
    pauseInterval: { type: Number, default: 4 }, // seconds
    autoRotation: { type: Boolean, default: true },
    hoverPause: { type: Boolean, default: true },
    resumeAfterHover: { type: Boolean, default: true },
    touchPause: { type: Boolean, default: true },
    infiniteLoop: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('NoticeSettings', noticeSettingsSchema);
