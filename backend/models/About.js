const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema({
    title: { type: String, default: 'Pawan Gautam' },
    subtitle: { type: String, default: 'Full-Stack Developer & Tech Innovator' },
    description: { type: String, default: 'I am a passionate developer and technology enthusiast dedicated to building high-quality, impactful digital solutions. With a strong foundation in modern web and mobile technologies, I help businesses and individuals achieve their goals through innovation and expertise.' },
    missionTitle: { type: String, default: 'Mission' },
    mission: { type: String, default: 'To bridge the gap between community and technology through transparent, rapid, and authorized digital service delivery.' },
    visionTitle: { type: String, default: 'Vision' },
    vision: { type: String, default: 'To be Delhi\'s most trusted digital gateway, recognized for absolute security and unmatched community empowerment.' },
    experience: { type: String, default: 'Over 12 Years of Professional Integrity' },
    address: { type: String, default: 'Mangolpuri, Delhi' },
    phone: { type: String, default: '9911423881' },
    imageUrl: { type: String, default: 'https://img.freepik.com/free-photo/handsome-young-man-with-new-hairstyle-wearing-blue-shirt-feeling-confident-isolated-white-background_176532-8097.jpg' },
    expertise: { type: [String], default: ['Web Dev', 'App Dev', 'Analytics', 'AI/ML', 'Portfolios', 'Custom'] },
    isVisible: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('About', aboutSchema);
