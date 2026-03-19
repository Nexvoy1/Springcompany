// fancards.js
const express = require('express');
const r = express.Router();
const { FanCard, Celebrity } = require('../models');
const { protect } = require('../middleware/auth');
const TIERS = { Silver: { price: 29, benefits: ['Exclusive content','Monthly updates','Fan community'] },
                Gold: { price: 79, benefits: ['Silver perks','Priority booking','Signed digital photo'] },
                VIP:  { price: 199, benefits: ['Gold perks','Meet & Greet invite','Signed merch pack'] } };
r.post('/', protect, async (req, res) => {
  try {
    const { celebrity, tier } = req.body;
    const t = TIERS[tier];
    if (!t) return res.status(400).json({ success: false, message: 'Invalid tier' });
    if (!await Celebrity.findById(celebrity)) return res.status(404).json({ success: false, message: 'Celebrity not found' });
    const card = await FanCard.create({ user: req.user._id, celebrity, tier, price: t.price, benefits: t.benefits,
      cardNumber: `FC-${Date.now().toString(36).toUpperCase()}`, expiresAt: new Date(Date.now() + 365*24*60*60*1000) });
    res.status(201).json({ success: true, fanCard: card });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
r.get('/my', protect, async (req, res) => {
  try {
    const cards = await FanCard.find({ user: req.user._id }).populate('celebrity','name image');
    res.json({ success: true, fanCards: cards });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
module.exports = r;
