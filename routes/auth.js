// ══════════════════════════════════════════════
// routes/auth.js — Register, Login, Profile
// ══════════════════════════════════════════════
const express = require('express');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { protect } = require('../middleware/auth');
const router = express.Router();
const sign = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

router.post('/register', [
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ success: false, errors: errs.array() });
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    if (await User.findOne({ email })) return res.status(409).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ firstName, lastName, email, password, phone });
    res.status(201).json({ success: true, token: sign(user._id), user: user.toPublic() });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ success: false, errors: errs.array() });
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, token: sign(user._id), user: user.toPublic() });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/me', protect, (req, res) => res.json({ success: true, user: req.user.toPublic() }));
module.exports = router;

// NOTE: Due to single-file constraint, each route module
// is separated by comments but all exported from here.
// In production, split into separate files per route.
