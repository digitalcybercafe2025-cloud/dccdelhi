const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
    image: { type: String, required: true },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    badge: { type: String, default: '' },
    buttonText: { type: String, default: '' },
    buttonLink: { type: String, default: '' },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('HeroSlide', heroSlideSchema);
