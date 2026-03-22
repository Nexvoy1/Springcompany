const express    = require('express');
const multer     = require('multer');
const path       = require('path');
const { protect } = require('../middleware/auth');
const { User }   = require('../models');
const router     = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/reels'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4, WebM, and MOV files are allowed'));
    }
  }
});

// ══════════════════════════════════════════════
// GET ALL REELS
// GET /api/reels
// ══════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const { category, sort = 'recent', limit = 20 } = req.query;

    let query = {};
    if (category) query.category = category;

    // In production, replace with actual Reel model
    // For now, return sample data
    const reels = [];

    res.json({
      success: true,
      reels: reels,
      total: reels.length
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ══════════════════════════════════════════════
// UPLOAD REEL
// POST /api/reels/upload
// ══════════════════════════════════════════════
router.post('/upload', protect, upload.single('video'), async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file uploaded' });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const videoPath = `/uploads/reels/${req.file.filename}`;

    // In production, create a Reel document in MongoDB
    // For now, return success response
    res.status(201).json({
      success: true,
      message: 'Reel uploaded successfully!',
      reelId: Date.now(),
      videoUrl: videoPath,
      title: title,
      description: description || '',
      category: category || 'Other',
      creator: req.user.firstName + ' ' + req.user.lastName,
      creatorId: req.user._id,
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: new Date()
    });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ══════════════════════════════════════════════
// LIKE REEL
// POST /api/reels/:reelId/like
// ══════════════════════════════════════════════
router.post('/:reelId/like', protect, async (req, res) => {
  try {
    const { reelId } = req.params;

    // In production, find and update Reel document
    // For now, return success response
    res.json({
      success: true,
      message: 'Reel liked!',
      reelId: reelId,
      liked: true,
      likes: Math.floor(Math.random() * 5000) + 100
    });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ══════════════════════════════════════════════
// UNLIKE REEL
// POST /api/reels/:reelId/unlike
// ══════════════════════════════════════════════
router.post('/:reelId/unlike', protect, async (req, res) => {
  try {
    const { reelId } = req.params;

    // In production, find and update Reel document
    // For now, return success response
    res.json({
      success: true,
      message: 'Reel unliked!',
      reelId: reelId,
      liked: false,
      likes: Math.floor(Math.random() * 5000)
    });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ══════════════════════════════════════════════
// FOLLOW CREATOR
// POST /api/reels/:creatorId/follow
// ══════════════════════════════════════════════
router.post('/:creatorId/follow', protect, async (req, res) => {
  try {
    const { creatorId } = req.params;

    // In production, update user's following list
    // For now, return success response
    res.json({
      success: true,
      message: 'Creator followed!',
      creatorId: creatorId,
      following: true
    });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ══════════════════════════════════════════════
// UNFOLLOW CREATOR
// POST /api/reels/:creatorId/unfollow
// ══════════════════════════════════════════════
router.post('/:creatorId/unfollow', protect, async (req, res) => {
  try {
    const { creatorId } = req.params;

    // In production, update user's following list
    // For now, return success response
    res.json({
      success: true,
      message: 'Creator unfollowed!',
      creatorId: creatorId,
      following: false
    });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ══════════════════════════════════════════════
// GET CREATOR REELS
// GET /api/reels/creator/:creatorId
// ══════════════════════════════════════════════
router.get('/creator/:creatorId', async (req, res) => {
  try {
    const { creatorId } = req.params;

    // In production, query Reels by creator
    // For now, return empty array
    res.json({
      success: true,
      reels: [],
      creatorId: creatorId
    });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ══════════════════════════════════════════════
// COMMENT ON REEL
// POST /api/reels/:reelId/comment
// ══════════════════════════════════════════════
router.post('/:reelId/comment', protect, async (req, res) => {
  try {
    const { reelId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    }

    // In production, create comment in database
    // For now, return success response
    res.status(201).json({
      success: true,
      message: 'Comment added!',
      comment: {
        id: Date.now(),
        text: text,
        author: req.user.firstName + ' ' + req.user.lastName,
        avatar: req.user.avatar,
        timestamp: new Date()
      }
    });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ══════════════════════════════════════════════
// GET REEL COMMENTS
// GET /api/reels/:reelId/comments
// ══════════════════════════════════════════════
router.get('/:reelId/comments', async (req, res) => {
  try {
    const { reelId } = req.params;

    // In production, fetch comments from database
    // For now, return empty array
    res.json({
      success: true,
      comments: [],
      reelId: reelId
    });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
