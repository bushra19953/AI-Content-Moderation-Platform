const mongoose = require('mongoose');

const AppealSchema = new mongoose.Schema({
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    justification: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
    adminResponse: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date }
});

module.exports = mongoose.model('Appeal', AppealSchema);
