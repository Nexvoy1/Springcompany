// users.js
const express = require('express');
const r = express.Router();
const { User, Booking, FanCard, Payment } = require('../models');
const { protect } = require('../middleware/auth');
r.get('/dashboard', protect, async (req, res) => {
  try {
    const [bookings, fanCards, payments] = await Promise.all([
      Booking.find({ user: req.user._id }).populate('celebrity','name image').sort({ createdAt:-1 }).limit(5),
      FanCard.find({ user: req.user._id }).populate('celebrity','name image'),
      Payment.find({ user: req.user._id, status:'completed' }).select('amount').lean(),
    ]);
    const totalSpent = payments.reduce((s,p)=>s+p.amount, 0);
    res.json({ success:true, bookings, fanCards, totalSpent, user: req.user.toPublic() });
  } catch (e) { res.status(500).json({ success:false, message:e.message }); }
});
r.put('/profile', protect, async (req, res) => {
  try {
    const allowed = ['firstName','lastName','phone','avatar'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new:true, runValidators:true });
    res.json({ success:true, user: user.toPublic() });
  } catch (e) { res.status(500).json({ success:false, message:e.message }); }
});
module.exports = r;
