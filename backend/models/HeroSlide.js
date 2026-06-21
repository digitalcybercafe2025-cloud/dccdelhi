const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
    image: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    badge: { type: String, default: 'Official Gateway' },
    buttonText: { type: String },
    buttonLink: { type: String },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('HeroSlide', heroSlideSchema);
