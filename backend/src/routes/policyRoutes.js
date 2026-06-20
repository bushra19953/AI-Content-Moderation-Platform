const express = require('express');
const router = express.Router();
const Policy = require('../models/Policy');
const { protect, admin } = require('../middleware/auth');

// Get active policy
router.get('/active', async (req, res) => {
    try {
        let policy = await Policy.findOne({ active: true });
        if (!policy) {
            policy = await Policy.create({ active: true });
        }
        res.json(policy);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update policy (admin only)
router.put('/update', protect, admin, async (req, res) => {
    try {
        const { categories } = req.body;
        await Policy.updateMany({}, { active: false });
        const newPolicy = await Policy.create({ active: true, categories });
        res.json(newPolicy);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
