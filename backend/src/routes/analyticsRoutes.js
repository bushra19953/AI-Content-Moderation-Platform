const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Verdict = require('../models/Verdict');
const Appeal = require('../models/Appeal');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

router.get('/dashboard', protect, admin, async (req, res) => {
    try {
        const totalSubmissions = await Submission.countDocuments();
        
        const verdicts = await Verdict.find();
        const outcomeDistribution = { Approved: 0, 'Flagged for Review': 0, Blocked: 0 };
        verdicts.forEach(v => {
            if(outcomeDistribution[v.overallOutcome] !== undefined) {
                outcomeDistribution[v.overallOutcome]++;
            }
        });

        const appeals = await Appeal.find();
        const totalAppeals = appeals.length;
        const appealOutcomes = { Accepted: 0, Rejected: 0, Pending: 0 };
        appeals.forEach(a => {
            if(appealOutcomes[a.status] !== undefined) {
                appealOutcomes[a.status]++;
            }
        });

        const users = await User.aggregate([
            {
                $lookup: {
                    from: 'submissions',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'submissions'
                }
            },
            {
                $project: {
                    username: 1,
                    submissionCount: { $size: "$submissions" }
                }
            },
            { $sort: { submissionCount: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            totalSubmissions,
            outcomeDistribution,
            totalAppeals,
            appealOutcomes,
            topUsers: users
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
