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

// ═══════════════════════════════════════════════════════════════════════
// CELEBRITY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

// Create new celebrity
r.post('/celebrities', async (req, res) => {
  try {
    const celeb = await Celebrity.create(req.body);
    res.status(201).json({ success: true, celebrity: celeb });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Update celebrity
r.put('/celebrities/:id', async (req, res) => {
  try {
    const celeb = await Celebrity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, celebrity: celeb });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Delete celebrity
r.delete('/celebrities/:id', async (req, res) => {
  try {
    await Celebrity.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Celebrity deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Get all celebrities (admin view with inactive)
r.get('/celebrities', async (req, res) => {
  try {
    const celebs = await Celebrity.find().sort({ featured: -1, createdAt: -1 });
    res.json({ success: true, celebrities: celebs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════
// POST/BLOG MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

// Create post
r.post('/posts', async (req, res) => {
  try {
    const post = await Post.create(req.body);
    res.status(201).json({ success: true, post });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Update post
r.put('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, post });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Delete post
r.delete('/posts/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Post deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Get all posts (admin view)
r.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════
// MESSAGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

// Get all messages
r.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({ success: true, messages, unread: messages.filter(m => !m.read).length });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Mark message as read
r.put('/messages/:id/read', async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, { read: true, readAt: new Date() }, { new: true });
    res.json({ success: true, message: msg });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Delete message
r.delete('/messages/:id', async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════
// BOOKING MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

// Update booking status
r.put('/bookings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('user celebrity');
    res.json({ success: true, booking });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Delete booking
r.delete('/bookings/:id', async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Booking deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════
// AUDITION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

// Get auditions model if it exists, otherwise use Message
r.get('/auditions', async (req, res) => {
  try {
    // Assuming auditions are stored as messages with type 'audition'
    const auditions = await Message.find({ type: 'audition' }).sort({ createdAt: -1 });
    res.json({ success: true, auditions });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Update audition status
r.put('/auditions/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const audition = await Message.findByIdAndUpdate(req.params.id, { status, auditStatus: status }, { new: true });
    res.json({ success: true, audition });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = r;
