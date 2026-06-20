const mongoose = require('mongoose');

const CategoryResultSchema = new mongoose.Schema({
    category: String,
    classification: Boolean,
    confidenceScore: Number,
    reasoning: String
}, { _id: false });

const VerdictSchema = new mongoose.Schema({
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
    overallOutcome: { type: String, enum: ['Approved', 'Flagged for Review', 'Blocked'], required: true },
    categoryBreakdown: [CategoryResultSchema],
    policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Verdict', VerdictSchema);
