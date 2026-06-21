const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Service = require('./models/Service');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/digital_cyber_cafe', {
    serverSelectionTimeoutMS: 30000 // Increase timeout to 30s
})
    .then(() => {
        console.log('MongoDB Connected For Seeding');
        seedDB();
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

const services = [
    {
        title: 'New PAN Card',
        description: 'Apply for fresh Permanent Account Number (PAN) with easy documentation.',
        image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
        fee: 150,
        requiredDocs: ['Aadhar Card', 'Proof of Date of Birth', 'Passport Size Photo'],
        category: 'Government',
        color: 'blue',
        estimatedDays: '10-15 working days',
        priority: 8
    },
    {
        title: 'Voter ID Card',
        description: 'New Voter Registration or Correction in existing Voter ID card.',
        image: 'https://images.unsplash.com/photo-1623282033815-40b05d96c903?auto=format&fit=crop&q=80&w=400',
        fee: 100,
        requiredDocs: ['Aadhar Card', 'Address Proof', 'Age Proof'],
        category: 'Government',
        color: 'green',
        estimatedDays: '20-30 working days',
        priority: 7
    },
    {
        title: 'Passport Service',
        description: 'Fresh Passport application, Renewal, and PCC services assistance.',
        image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?auto=format&fit=crop&q=80&w=400',
        fee: 500,
        requiredDocs: ['Aadhar Card', 'High School Marksheet', 'Electricity Bill'],
        category: 'Government',
        color: 'orange',
        estimatedDays: '15-20 working days',
        priority: 6
    },
    {
        title: 'ITR Filing',
        description: 'Income Tax Return filing for Salaried and Business individuals.',
        image: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=400',
        fee: 999,
        requiredDocs: ['Form 16', 'PAN Card', 'Bank Statement'],
        category: 'Digital',
        color: 'red',
        estimatedDays: '2-3 working days',
        priority: 5
    },
    {
        title: 'Domicile Certificate',
        description: 'State residence proof for education and government job purposes.',
        image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400',
        fee: 80,
        requiredDocs: ['Aadhar Card', 'Voter ID', 'Ration Card'],
        category: 'Government',
        color: 'blue',
        estimatedDays: '15-20 working days',
        priority: 4
    },
    {
        title: 'GST Registration',
        description: 'New GST Registration and Monthly Return Filing services.',
        image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=400',
        fee: 1500,
        requiredDocs: ['PAN Card', 'Electricity Bill', 'NOC from Owner'],
        category: 'Digital',
        color: 'green',
        estimatedDays: '7-10 working days',
        priority: 3
    },
    {
        title: 'Aadhaar Correction',
        description: 'Update name, address, or mobile in your Aadhaar card easily.',
        image: 'https://images.unsplash.com/photo-1633526543814-9718c8922b7a?auto=format&fit=crop&q=80&w=400',
        fee: 50,
        requiredDocs: ['Aadhar Card', 'Supportive Proof'],
        category: 'Government',
        color: 'blue',
        estimatedDays: '5-10 working days',
        priority: 2
    },
    {
        title: 'Driving License',
        description: 'Apply for Learning or Permanent Driving License online.',
        image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=400',
        fee: 300,
        requiredDocs: ['Aadhar Card', 'Blood Group Report', 'Photo'],
        category: 'Government',
        color: 'orange',
        estimatedDays: '30-45 working days',
        priority: 1
    }
];

const seedDB = async () => {
    try {
        await Service.deleteMany({});
        console.log('Cleared existing services');
        await Service.insertMany(services);
        console.log('Services Seeded Successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
