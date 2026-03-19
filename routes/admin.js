const express = require('express');
const r = express.Router();
const { User, Celebrity, Booking, Payment, FanCard, Post, Message, Subscriber } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');
r.use(protect, adminOnly);

// Dashboard stats
r.get('/stats', async (req, res) => {
  try {
    const [users, celebrities, bookings, payments, fanCards, messages, subscribers] = await Promise.all([
      User.countDocuments(),
      Celebrity.countDocuments({ active: true }),
      Booking.countDocuments(),
      Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      FanCard.countDocuments({ active: true }),
      Message.countDocuments({ read: false }),
      Subscriber.countDocuments({ active: true }),
    ]);
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    res.json({ success: true, stats: {
      users, celebrities, bookings, pendingBookings,
      revenue: payments[0]?.total || 0,
      activeFanCards: fanCards,
      unreadMessages: messages,
      subscribers
    }});
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// All users
r.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// All bookings with full details
r.get('/bookings', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const bookings = await Booking.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('celebrity', 'name image baseFee')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// All payments
r.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// All fan cards
r.get('/fancards', async (req, res) => {
  try {
    const cards = await FanCard.find()
      .populate('user', 'firstName lastName email')
      .populate('celebrity', 'name').sort({ createdAt: -1 });
    res.json({ success: true, fanCards: cards });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Promote user to admin
r.put('/users/:id/role', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
    res.json({ success: true, user: user.toPublic() });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = r;
