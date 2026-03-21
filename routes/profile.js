// ══════════════════════════════════════════════
// routes/profile.js  — User Profile & Dashboard
// Mount in server.js: app.use('/api/profile', require('./routes/profile'));
// ══════════════════════════════════════════════
const express = require('express');
const bcrypt  = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User, Booking, Payment, FanCard, Celebrity } = require('../models');
const { protect } = require('../middleware/auth');
const router  = express.Router();

// All routes are protected
router.use(protect);

// ── GET FULL PROFILE ──────────────────────────
// GET /api/profile/me
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({ path: 'fanCards', populate: { path: 'celebrity', select: 'name image category' } })
      .populate({ path: 'bookings', populate: { path: 'celebrity', select: 'name image category' } });
    res.json({ success: true, user: user.toPublic() });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── UPDATE PROFILE ────────────────────────────
// PUT /api/profile/update
router.put('/update', [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('username').optional().trim().isLength({ min: 3 }),
  body('bio').optional().trim().isLength({ max: 300 }),
  body('location').optional().trim(),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ success: false, message: errs.array()[0].msg });
  try {
    const allowed = ['firstName','lastName','username','bio','location','avatar',
                     'socialLinks','gender','country','state','lga'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    // Check username uniqueness
    if (updates.username) {
      const taken = await User.findOne({ username: updates.username.toLowerCase(), _id: { $ne: req.user._id } });
      if (taken) return res.status(409).json({ success: false, message: 'Username already taken.' });
      updates.username = updates.username.toLowerCase();
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated!', user: user.toPublic() });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── CHANGE PASSWORD ───────────────────────────
// PUT /api/profile/change-password
router.put('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ success: false, message: errs.array()[0].msg });
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully!' });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── DASHBOARD STATS ───────────────────────────
// GET /api/profile/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const uid = req.user._id;

    const [bookings, payments, fanCards] = await Promise.all([
      Booking.find({ user: uid }).populate('celebrity','name image category').sort('-createdAt').limit(10),
      Payment.find({ user: uid }).sort('-createdAt').limit(20),
      FanCard.find({ user: uid }).populate('celebrity','name image category').sort('-createdAt'),
    ]);

    // Stats
    const totalSpent    = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
    const totalBookings = bookings.length;
    const pendingCount  = bookings.filter(b => b.status === 'pending').length;
    const completedCount= bookings.filter(b => b.status === 'completed').length;

    // Favourite celebrity (most booked)
    const celeb_counts = {};
    bookings.forEach(b => { if(b.celebrity) { const id = b.celebrity._id.toString(); celeb_counts[id] = (celeb_counts[id]||0)+1; } });
    const favId = Object.keys(celeb_counts).sort((a,b)=>celeb_counts[b]-celeb_counts[a])[0];
    const favCeleb = favId ? bookings.find(b => b.celebrity && b.celebrity._id.toString()===favId)?.celebrity : null;

    // User rank based on total spent
    let rank = 'Regular', nextRank = 'Silver', rankProgress = 0, rankTarget = 500;
    if (totalSpent >= 50000)       { rank = 'VIP';    nextRank = null;     rankProgress = 100; rankTarget = 50000; }
    else if (totalSpent >= 5000)   { rank = 'Gold';   nextRank = 'VIP';   rankProgress = Math.round((totalSpent-5000)/450); rankTarget = 50000; }
    else if (totalSpent >= 500)    { rank = 'Silver'; nextRank = 'Gold';  rankProgress = Math.round((totalSpent-500)/45);   rankTarget = 5000; }
    else                           { rankProgress = Math.round(totalSpent/5); rankTarget = 500; }

    // Wallet (simulated — replace with real wallet model when ready)
    const walletBalance = Math.max(0, 1000 - totalSpent % 1000); // Demo logic

    // Monthly spending chart (last 6 months)
    const now = new Date();
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthPayments = payments.filter(p => {
        const pd = new Date(p.createdAt);
        return pd >= d && pd <= end && p.status === 'completed';
      });
      monthlyData.push({
        month: d.toLocaleString('default', { month: 'short' }),
        amount: monthPayments.reduce((s, p) => s + p.amount, 0),
        count: monthPayments.length
      });
    }

    res.json({
      success: true,
      dashboard: {
        stats: { totalSpent, totalBookings, pendingCount, completedCount, fanCardCount: fanCards.length, walletBalance },
        rank: { current: rank, next: nextRank, progress: rankProgress, target: rankTarget, spent: totalSpent },
        bookings: bookings.slice(0, 8),
        recentPayments: payments.slice(0, 10),
        fanCards,
        favCeleb,
        monthlyChart: monthlyData,
      }
    });
  } catch(e) {
    console.error('Dashboard error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── WALLET TRANSACTIONS ───────────────────────
// GET /api/profile/transactions
router.get('/transactions', async (req, res) => {
  try {
    const { type, status, limit = 20, page = 1 } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (status) filter.status = status;
    const payments = await Payment.find(filter)
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page)-1)*Number(limit))
      .populate('booking','eventName celebrity')
      .populate('fanCard','tier celebrity');
    const total = await Payment.countDocuments(filter);
    res.json({ success: true, payments, total, page: Number(page) });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── NOTIFICATIONS ─────────────────────────────
// GET /api/profile/notifications
router.get('/notifications', async (req, res) => {
  try {
    // Build notifications from recent booking changes + payments
    const [bookings, payments] = await Promise.all([
      Booking.find({ user: req.user._id }).sort('-updatedAt').limit(5).populate('celebrity','name'),
      Payment.find({ user: req.user._id }).sort('-createdAt').limit(5),
    ]);
    const notifs = [];
    bookings.forEach(b => {
      notifs.push({
        id: b._id, type: 'booking', icon: 'calendar',
        title: `Booking ${b.status}`,
        text: `Your booking for ${b.celebrity?.name || 'a celebrity'} is ${b.status}`,
        time: b.updatedAt, read: false,
        color: b.status==='confirmed'?'green':b.status==='rejected'?'red':'gold'
      });
    });
    payments.forEach(p => {
      notifs.push({
        id: p._id, type: 'payment', icon: 'credit-card',
        title: `Payment ${p.status}`,
        text: `$${p.amount.toLocaleString()} payment ${p.status}`,
        time: p.createdAt, read: false, color: p.status==='completed'?'green':'gold'
      });
    });
    notifs.sort((a,b) => new Date(b.time) - new Date(a.time));
    res.json({ success: true, notifications: notifs.slice(0,10) });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── SAVED FAVORITES ───────────────────────────
// GET /api/profile/favorites
router.get('/favorites', async (req, res) => {
  try {
    // For now use bookings to derive favorites
    const bookings = await Booking.find({ user: req.user._id })
      .populate('celebrity','name image category baseFee verified');
    const seen = new Set();
    const favorites = bookings
      .filter(b => b.celebrity && !seen.has(b.celebrity._id.toString()) && seen.add(b.celebrity._id.toString()))
      .map(b => b.celebrity);
    res.json({ success: true, favorites });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
