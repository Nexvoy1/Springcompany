// ══════════════════════════════════════════════
// routes/celebrities.js
// ══════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { Celebrity } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');

// GET all celebrities (with filters)
router.get('/', async (req, res) => {
  try {
    const { cat, verified, featured, search, page = 1, limit = 12 } = req.query;
    const filter = { active: true };
    if (cat) filter.category = cat;
    if (verified) filter.verified = verified === 'true';
    if (featured) filter.featured = featured === 'true';
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { occupation: { $regex: search, $options: 'i' } },
    ];
    const total = await Celebrity.countDocuments(filter);
    const celebs = await Celebrity.find(filter)
      .sort({ featured: -1, rating: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, celebrities: celebs, total, pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET single celebrity by ID or slug
router.get('/:id', async (req, res) => {
  try {
    const celeb = await Celebrity.findOne({
      $or: [{ _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : null }, { slug: req.params.id }]
    });
    if (!celeb) return res.status(404).json({ success: false, message: 'Celebrity not found' });
    res.json({ success: true, celebrity: celeb });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST create (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const celeb = await Celebrity.create(req.body);
    res.status(201).json({ success: true, celebrity: celeb });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT update (admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const celeb = await Celebrity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, celebrity: celeb });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Celebrity.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ success: true, message: 'Celebrity deactivated' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT toggle verification (admin only)
router.put('/:id/verify', protect, adminOnly, async (req, res) => {
  try {
    const c = await Celebrity.findById(req.params.id);
    c.verified = !c.verified;
    await c.save();
    res.json({ success: true, celebrity: c });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
