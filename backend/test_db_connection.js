const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/digital_cyber_cafe';

console.log('Testing connection to:', uri);

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        console.log('Successfully connected to MongoDB!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection Failed:', err.message);
        process.exit(1);
    });
