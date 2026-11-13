const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const rateLimit = require('express-rate-limit');

dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/digital_cyber_cafe')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

const app = express();
app.set('trust proxy', 1);

// Rate Limiting (relaxed for seamless client-side page switching and reads)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000,
    skip: (req) => req.method === 'GET', // Never throttle public reads or navigation
    message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically with caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    etag: true
}));

// Routes
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/inquiries', require('./routes/inquiryRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/testimonials', require('./routes/testimonialRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/hero', require('./routes/heroRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/about', require('./routes/aboutRoutes'));

// System Health Check (for live server status monitoring)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'online',
        service: 'Digital Cyber Cafe API',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

// Default Route
app.get('/', (req, res) => {
    res.send('🚀 Digital Cyber Cafe API is running...');
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
