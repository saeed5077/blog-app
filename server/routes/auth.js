const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ── Helper: generate token ──────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE // 15m from .env
  });
};

// ── POST /api/auth/register ─────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user — password auto-hashed by pre-save hook
    const user = await User.create({ name, email, password });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });

  } catch (err) {
    next(err); // passes to global error handler in server.js
  }
});

// ── POST /api/auth/login ────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Must use .select('+password') because we set select:false on schema
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Use instance method we defined on the schema
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });

  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ────────────────────────────────────────────
// Returns currently logged in user's data
// Useful for frontend to rehydrate user on page refresh
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/auth/updatepassword ────────────────────────────────
router.put('/updatepassword', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Explicitly request password since select:false
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Assign new password — pre-save hook will hash it automatically
    user.password = newPassword;
    await user.save();

    res.json({
      token: generateToken(user._id),
      message: 'Password updated successfully'
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;