const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    trackingId: { type: String },
    serviceName: { type: String },
    amount: { type: Number, required: true },
    transactionId: { type: String },
    paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Pending' },
    paymentDate: { type: Date, default: Date.now },
    userDetails: {
        fullName: String,
        mobile: String,
        email: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
