const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    siteName: { type: String, default: 'Digital Cyber Cafe' },
    contactNumber: { type: String, default: '8445221632' },
    whatsapp: { type: String, default: '8445221632' },
    email: { type: String, default: 'digitalcybercafe@gmail.com' },
    address: { type: String, default: 'Mangolpuri, Delhi' },
    slogan: { type: String, default: 'Bridging the digital divide with security and speed.' },
    footerText: { type: String, default: '© 2026 Digital Cyber Cafe Mangolpuri • Powered by SevaCore' },
    instagramUrl: { type: String, default: '' },
    facebookUrl: { type: String, default: '' },
    upiId: { type: String, default: '8445221632@upi' },
    upiPayeeName: { type: String, default: 'Digital Cyber Cafe' },
    adminInviteCodeHash: { type: String, select: false }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
