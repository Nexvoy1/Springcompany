// ══════════════════════════════════════════════════════════════
// routes/admin.js  —  COMPLETE ADMIN API
// All CRUD operations wired to MongoDB
// ══════════════════════════════════════════════════════════════
const express = require('express');
const r = express.Router();
const { User, Celebrity, Booking, Payment, FanCard, Post, Message, Subscriber } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');
r.use(protect, adminOnly);

// ── DASHBOARD STATS ───────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════
// CELEBRITIES
// ══════════════════════════════════════════════════════════════
r.get('/celebrities', async (req, res) => {
  try {
    const celebs = await Celebrity.find().sort({ createdAt: -1 });
    res.json({ success: true, celebrities: celebs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.post('/celebrities', async (req, res) => {
  try {
    const { name, occupation, category, bio, image, baseFee,
            nationality, yearsActive, dob, featured, verified, active,
            socialLinks, tags } = req.body;
    if (!name || !occupation || !category || !bio) {
      return res.status(400).json({ success: false, message: 'Name, occupation, category and bio are required.' });
    }
    const celeb = await Celebrity.create({
      name, occupation, category, bio,
      image: image || '',
      baseFee: baseFee || 'Contact for pricing',
      nationality: nationality || '',
      yearsActive: yearsActive || '',
      dob: dob || '',
      featured: featured || false,
      verified: verified || false,
      active: active !== false,
      socialLinks: socialLinks || {},
      tags: tags || []
    });
    res.status(201).json({ success: true, celebrity: celeb });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.put('/celebrities/:id', async (req, res) => {
  try {
    const celeb = await Celebrity.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!celeb) return res.status(404).json({ success: false, message: 'Celebrity not found.' });
    res.json({ success: true, celebrity: celeb });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.delete('/celebrities/:id', async (req, res) => {
  try {
    await Celebrity.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Celebrity deleted.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// BOOKINGS
// ══════════════════════════════════════════════════════════════
r.get('/bookings', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const bookings = await Booking.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('celebrity', 'name image baseFee category')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.put('/bookings/:id/status', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const allowed = ['pending','reviewing','approved','rejected','confirmed','completed','cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const update = { status };
    if (adminNotes) update.adminNotes = adminNotes;
    if (status === 'confirmed') update.confirmedAt = new Date();
    const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'firstName lastName email')
      .populate('celebrity', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    res.json({ success: true, booking });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.delete('/bookings/:id', async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Booking deleted.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// POSTS (Trending Posts)
// ══════════════════════════════════════════════════════════════
r.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.post('/posts', async (req, res) => {
  try {
    const { title, content, excerpt, image, category, published, featured, tags } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required.' });
    const post = await Post.create({
      title,
      content: content || '',
      excerpt: excerpt || '',
      image: image || '',
      category: category || 'News',
      author: req.user._id,
      published: published !== false,
      featured: featured || false,
      tags: tags || []
    });
    res.status(201).json({ success: true, post });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.put('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, post });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.delete('/posts/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Post deleted.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// MESSAGES
// ══════════════════════════════════════════════════════════════
r.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.put('/messages/:id/read', async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json({ success: true, message: msg });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.put('/messages/:id/reply', async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true, replied: true },
      { new: true }
    );
    res.json({ success: true, message: msg });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.delete('/messages/:id', async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════
r.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.put('/users/:id/role', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, { role: req.body.role }, { new: true }
    );
    res.json({ success: true, user: user.toPublic() });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.put('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true, emailVerified: true, phoneVerified: true },
      { new: true }
    );
    res.json({ success: true, user: user.toPublic() });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════════════════════════
r.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'firstName lastName email')
      .populate('booking', 'eventName')
      .sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.put('/payments/:id/status', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    res.json({ success: true, payment });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// FAN CARDS
// ══════════════════════════════════════════════════════════════
r.get('/fancards', async (req, res) => {
  try {
    const cards = await FanCard.find()
      .populate('user', 'firstName lastName email')
      .populate('celebrity', 'name image')
      .sort({ createdAt: -1 });
    res.json({ success: true, fanCards: cards });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// SUBSCRIBERS
// ══════════════════════════════════════════════════════════════
r.get('/subscribers', async (req, res) => {
  try {
    const subs = await Subscriber.find({ active: true }).sort({ createdAt: -1 });
    res.json({ success: true, subscribers: subs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// SITE SETTINGS (for saveToAPI calls from admin panel sections)
// ══════════════════════════════════════════════════════════════
// In-memory site settings store (persists per-process)
// For a production app you'd use a Settings model in MongoDB
const SiteSettings = require('../models').SiteSettings || (() => {
  // Inline fallback if SiteSettings model not yet created
  const schema = new (require('mongoose').Schema)({
    section: { type: String, required: true, unique: true },
    data: { type: require('mongoose').Schema.Types.Mixed, default: {} }
  }, { timestamps: true });
  return require('mongoose').models.SiteSettings ||
         require('mongoose').model('SiteSettings', schema);
})();

r.get('/site/:section', async (req, res) => {
  try {
    const doc = await SiteSettings.findOne({ section: req.params.section });
    res.json({ success: true, data: doc ? doc.data : {} });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

r.post('/site/:section', async (req, res) => {
  try {
    const doc = await SiteSettings.findOneAndUpdate(
      { section: req.params.section },
      { section: req.params.section, data: req.body },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'Settings saved.', data: doc.data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = r;
