const express = require('express');
const router = express.Router();
const Appeal = require('../models/Appeal');
const Verdict = require('../models/Verdict');
const { protect, admin } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
    try {
        const { submissionId, justification } = req.body;
        const appealExists = await Appeal.findOne({ submissionId });
        if (appealExists) {
            return res.status(400).json({ message: 'Appeal already filed for this submission' });
        }
        const appeal = await Appeal.create({
            submissionId,
            userId: req.user._id,
            justification
        });
        res.status(201).json(appeal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/my', protect, async (req, res) => {
    try {
        const appeals = await Appeal.find({ userId: req.user._id }).populate('submissionId');
        res.json(appeals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/pending', protect, admin, async (req, res) => {
    try {
        const appeals = await Appeal.find({ status: 'Pending' }).populate('submissionId').populate('userId', 'username');
        res.json(appeals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id/review', protect, admin, async (req, res) => {
    try {
        const { status, adminResponse } = req.body;
        const appeal = await Appeal.findById(req.params.id);
        
        if (!appeal) return res.status(404).json({ message: 'Appeal not found' });

        appeal.status = status;
        appeal.adminResponse = adminResponse;
        appeal.reviewedBy = req.user._id;
        appeal.reviewedAt = Date.now();
        await appeal.save();

        if (status === 'Accepted') {
            await Verdict.findOneAndUpdate({ submissionId: appeal.submissionId }, { overallOutcome: 'Approved' });
        }

        res.json(appeal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
