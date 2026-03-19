const express = require('express');
const r = express.Router();
const { Message, Subscriber } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');
r.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ success: false, message: 'Name, email and message required' });
    await Message.create({ name, email, subject, message });
    res.json({ success: true, message: 'Message received. We will respond within 2 hours.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
r.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    await Subscriber.findOneAndUpdate({ email }, { active: true }, { upsert: true, new: true });
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
r.get('/', protect, adminOnly, async (req, res) => {
  try {
    const msgs = await Message.find().sort({ createdAt: -1 });
    res.json({ success: true, messages: msgs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
r.put('/:id/read', protect, adminOnly, async (req, res) => {
  try { res.json({ success: true, message: await Message.findByIdAndUpdate(req.params.id, { read: true }, { new: true }) }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
module.exports = r;
