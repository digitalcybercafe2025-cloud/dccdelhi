const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    siteName: { type: String, default: 'Digital Cyber Cafe' },
    contactNumber: { type: String, default: '8445221632' },
    whatsapp: { type: String, default: '8445221632' },
    email: { type: String, default: 'digitalcybercafe@gmail.com' },
    address: { type: String, default: 'Mangolpuri, Delhi' },
    slogan: { type: String, default: 'Bridging the digital divide with security and speed.' },
    footerText: { type: String, default: '© 2026 Digital Cyber Cafe Mangolpuri • Powered by Digital Cyber Zone' },
    instagramUrl: { type: String, default: '' },
    facebookUrl: { type: String, default: '' },
    threadsUrl: { type: String, default: '' },
    twitterUrl: { type: String, default: '' },
    youtubeUrl: { type: String, default: '' },
    googleMapsUrl: { type: String, default: 'https://maps.google.com/?q=Digital+Cyber+Cafe+Mangolpuri+Delhi' },
    upiId: { type: String, default: '8445221632@upi' },
    upiPayeeName: { type: String, default: 'Digital Cyber Cafe' },
    // Digital Solutions & Service Costs
    appStartingFee: { type: String, default: '₹4,999/- onwards' },
    webStartingFee: { type: String, default: '₹2,999/- onwards' },
    designStartingFee: { type: String, default: '₹499/- onwards' },
    techStartingFee: { type: String, default: '₹150/- onwards' },
    // Legal & Policy Content
    privacyPolicy: { type: String, default: '' },
    termsAndConditions: { type: String, default: '' },
    disclaimer: { type: String, default: '' },
    // Hero Carousel Settings
    heroAutoplay: { type: Boolean, default: true },
    heroInterval: { type: Number, default: 5 },
    heroShowIndicators: { type: Boolean, default: true },
    heroShowArrows: { type: Boolean, default: true },
    heroTransition: { type: String, default: 'fade' },
    // Testimonials Settings
    testimonialAutoplay: { type: Boolean, default: true },
    testimonialInterval: { type: Number, default: 5 },
    testimonialMinRating: { type: Number, default: 4 },
    testimonialShowAvatar: { type: Boolean, default: true },
    adminInviteCodeHash: { type: String, select: false }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
