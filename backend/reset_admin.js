const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// ── CHANGE THESE IF NEEDED ──────────────────────────────────────────────
const ADMIN_EMAIL = '8445221632';
const ADMIN_PASSWORD = 'Admin@2026';
// ────────────────────────────────────────────────────────────────────────

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff'], default: 'admin' },
    createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

const resetAdmin = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/digital_cyber_cafe';
        console.log('Connecting to:', mongoUri);
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected\n');

        // Delete existing admin
        const deleted = await Admin.deleteMany({ email: ADMIN_EMAIL });
        console.log(`🗑️  Deleted ${deleted.deletedCount} existing admin record(s)`);

        // Create fresh admin with hashed password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

        await Admin.collection.insertOne({
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date()
        });

        console.log('\n✅ Admin Created Successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Email/ID :', ADMIN_EMAIL);
        console.log('  Password :', ADMIN_PASSWORD);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\nYou can now login to the admin panel.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

resetAdmin();
