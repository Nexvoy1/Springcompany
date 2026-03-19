// posts.js
const express = require('express');
const r = express.Router();
const { Post } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');
r.get('/', async (req, res) => {
  try {
    const { featured, limit = 10, page = 1 } = req.query;
    const f = { published: true };
    if (featured) f.featured = true;
    const posts = await Post.find(f).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit));
    res.json({ success: true, posts });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
r.post('/', protect, adminOnly, async (req, res) => {
  try { res.status(201).json({ success: true, post: await Post.create({ ...req.body, author: req.user._id }) }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
r.put('/:id', protect, adminOnly, async (req, res) => {
  try { res.json({ success: true, post: await Post.findByIdAndUpdate(req.params.id, req.body, { new: true }) }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
r.delete('/:id', protect, adminOnly, async (req, res) => {
  try { await Post.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
module.exports = r;
