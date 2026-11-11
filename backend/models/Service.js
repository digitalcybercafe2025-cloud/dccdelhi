const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    fee: {
        type: Number,
        required: true
    },
    requiredDocs: [{
        type: String
    }],
    mandatoryDocs: [{
        type: String
    }],
    idProofs: [{
        type: String
    }],
    addressProofs: [{
        type: String
    }],
    otherDocs: [{
        type: String
    }],
    documentConfigs: [{
        subTypeKey: { type: String, required: true, trim: true },
        subTypeLabel: { type: String, required: true, trim: true },
        documents: [{
            name: { type: String, required: true, trim: true },
            required: { type: Boolean, default: true }
        }]
    }],
    category: {
        type: String,
        required: true,
        enum: ['Government', 'Digital', 'Academic']
    },
    externalLink: {
        type: String,
        required: false
    },
    color: {
        type: String,
        enum: ['blue', 'green', 'orange', 'red'],
        default: 'blue'
    },
    priority: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    },
    estimatedDays: {
        type: String,
        default: '7-10 working days'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
