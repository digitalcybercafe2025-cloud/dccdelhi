const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

const listAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/digital_cyber_cafe');
        console.log('MongoDB Connected');

        const admins = await Admin.find({});
        console.log('Admins found:', admins.length);
        admins.forEach(admin => {
            console.log('ID:', admin._id);
            console.log('Email/User:', admin.email);
            console.log('Role:', admin.role);
            console.log('---');
        });

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listAdmins();
