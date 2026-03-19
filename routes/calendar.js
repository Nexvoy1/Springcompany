// calendar.js
const express = require('express');
const r = express.Router();
const { Calendar } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');
r.get('/:celebrityId', async (req, res) => {
  try {
    const { year, month } = req.query;
    const start = new Date(year || new Date().getFullYear(), (month||new Date().getMonth()+1)-1, 1);
    const end = new Date(start.getFullYear(), start.getMonth()+1, 0);
    const slots = await Calendar.find({ celebrity: req.params.celebrityId, date: { $gte: start, $lte: end } });
    res.json({ success: true, availability: slots });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
r.post('/', protect, adminOnly, async (req, res) => {
  try {
    const slot = await Calendar.findOneAndUpdate(
      { celebrity: req.body.celebrity, date: req.body.date },
      req.body, { upsert: true, new: true });
    res.json({ success: true, slot });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
module.exports = r;
