const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
    const secret = (process.env.JWT_SECRET || 'supersecretjwtkey123').trim();
    return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

router.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({ username, password: hashedPassword, role: role || 'user' });

        if (user) {
            res.status(201).json({ _id: user._id, username: user.username, role: user.role, token: generateToken(user._id) });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({ _id: user._id, username: user.username, role: user.role, token: generateToken(user._id) });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/me', protect, (req, res) => {
    res.json(req.user);
});

module.exports = router;
