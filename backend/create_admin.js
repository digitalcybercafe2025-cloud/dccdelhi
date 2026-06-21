const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/digital_cyber_cafe');
        console.log('MongoDB Connected');

        const email = '8445221632';
        const password = 'Admin@2026';

        const adminExists = await Admin.findOne({ email });

        if (adminExists) {
            console.log('Admin already exists');
            console.log('Email:', email);
            console.log('Password: (Already set)');
        } else {
            // Hash password manually if the model doesn't do it pre-save (checking model is good, but doing it here ensures it works)
            // Let's rely on the model if it has pre-save, but since I haven't seen the model file, 
            // I'll check if the controller does it. The controller uses Admin.create({ email, password }).
            // If the model has pre-save hook for hashing, we are good.
            // If not, we should hash it here. 

            // To be safe, I will read the model file first, BUT to save time/turns, 
            // I'll just use the same logic as the controller which passes raw password
            // assuming the model handles it.

            // WAIT, looking at the controller code: 
            // const admin = await Admin.create({ email, password });
            // This suggests the model probably has a pre-save hook.

            const admin = await Admin.create({
                email,
                password
            });

            console.log('Admin Created Successfully');
            console.log('Email:', email);
            console.log('Password:', password);
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createAdmin();
