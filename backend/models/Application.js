const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  serviceName: {
    type: String,
    required: true
  },
  serviceId: {
    type: String,
    required: true
  },
  userDetails: {
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    email: String,
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  // Dynamic per-service fields (e.g. DOB, father's name, PAN number, etc.)
  serviceSpecificFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  documents: [{
    docType: String,
    fileName: String,
    filePath: String,
    originalName: String,
    mimeType: String,
    fileSize: Number
  }],
  paymentDetails: {
    amount: { type: Number, required: true },
    transactionId: String,
    paymentId: String,       // Alias used by payment gateways
    method: { type: String, default: 'upi' }, // upi | cash | card
    paymentStatus: {
      type: String,
      default: 'PENDING_VERIFICATION'
    },
    paymentDate: { type: Date, default: Date.now },
    screenshotUrl: String,
    evidenceType: {
      type: String,
      default: 'none'
    }, // utr_only | screenshot_only | both | cash | none
    verifiedBy: String,
    verifiedAt: Date,
    rejectionReason: String,
    adminRemark: String,
    auditLog: [{
      action: String,
      performedBy: String,
      timestamp: { type: Date, default: Date.now },
      note: String
    }]
  },
  status: {
    type: String,
    enum: ['received', 'review', 'verifying', 'completed', 'rejected'],
    default: 'received',
    index: true
  },
  adminRemarks: String,        // Internal admin note (not shown to user)
  rejectionReason: String,     // Shown to user if rejected
  certificateUrl: String,      // Path to generated or uploaded certificate
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update updatedAt on save
applicationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
