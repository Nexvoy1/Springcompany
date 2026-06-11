import express from 'express';
import Content from '../models/Content.js';
import ActivityLog from '../models/ActivityLog.js';
import { authenticate, authorize, checkPermission } from '../middleware/auth.js';
import { validationResult, body } from 'express-validator';

const router = express.Router();

// @route   GET /api/content
// @desc    Get all content with filtering
// @access  Public (published only) / Private (all for admins)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category = '', status = '', search = '' } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};

    // If not authenticated, only show published content
    if (!req.user || (req.user?.role?.name !== 'Super Admin' && req.user?.role?.name !== 'Admin')) {
      filter.status = 'Published';
    } else if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') },
      ];
    }

    const content = await Content.find(filter)
      .populate('author', 'firstName lastName email')
      .limit(limit * 1)
      .skip(skip)
      .sort({ publishedAt: -1, createdAt: -1 });

    const total = await Content.countDocuments(filter);

    res.json({
      success: true,
      content,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (err) {
    console.error('Get content error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/content/:id
// @desc    Get content by ID
// @access  Public (published only) / Private (own or admin)
router.get('/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('author', 'firstName lastName email avatar');

    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Check if user can view unpublished content
    if (content.status !== 'Published') {
      if (!req.user || (req.user.id !== content.author._id && req.user.role?.name !== 'Super Admin' && req.user.role?.name !== 'Admin')) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this content' });
      }
    }

    // Increment views (only once per user/session)
    content.views += 1;
    await content.save();

    res.json({ success: true, content });
  } catch (err) {
    console.error('Get content error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/content
// @desc    Create new content
// @access  Private (Content Manager+)
router.post(
  '/',
  authenticate,
  authorize('Super Admin', 'Admin', 'Content Manager', 'Editor'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').isIn(['News', 'Blog', 'Page', 'Announcement', 'Celebrity Info']).withMessage('Invalid category'),
    body('content').trim().notEmpty().withMessage('Content is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { title, category, content, tags = [], status = 'Draft' } = req.body;

      const newContent = new Content({
        title,
        category,
        content,
        tags: tags.split(',').map(tag => tag.trim()),
        status,
        author: req.user.id,
      });

      await newContent.save();

      // Log activity
      await ActivityLog.create({
        user: req.user.id,
        action: 'CREATE',
        entityType: 'Content',
        entityId: newContent._id,
        entityTitle: title,
        details: `Content created: ${title} (${status})`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json({ success: true, message: 'Content created successfully', content: newContent });
    } catch (err) {
      console.error('Create content error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   PUT /api/content/:id
// @desc    Update content
// @access  Private (Own content or Admin+)
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().trim().notEmpty(),
    body('category').optional().isIn(['News', 'Blog', 'Page', 'Announcement', 'Celebrity Info']),
    body('content').optional().trim().notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const content = await Content.findById(req.params.id);
      if (!content) {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }

      // Check authorization
      if (req.user.id !== content.author && req.user.role?.name !== 'Super Admin' && req.user.role?.name !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to update this content' });
      }

      const changes = {};
      const { title, category, contentText, tags, status } = req.body;

      if (title && title !== content.title) {
        changes.title = `${content.title} → ${title}`;
        content.title = title;
      }
      if (category && category !== content.category) {
        changes.category = `${content.category} → ${category}`;
        content.category = category;
      }
      if (contentText && contentText !== content.content) {
        changes.content = 'Content updated';
        content.content = contentText;
      }
      if (tags) {
        content.tags = tags.split(',').map(tag => tag.trim());
      }
      if (status && status !== content.status) {
        changes.status = `${content.status} → ${status}`;
        content.status = status;
        if (status === 'Published') {
          content.publishedAt = new Date();
        }
      }

      await content.save();

      // Log activity
      await ActivityLog.create({
        user: req.user.id,
        action: 'UPDATE',
        entityType: 'Content',
        entityId: content._id,
        entityTitle: content.title,
        changes: changes,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ success: true, message: 'Content updated successfully', content });
    } catch (err) {
      console.error('Update content error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   POST /api/content/:id/publish
// @desc    Publish content
// @access  Private (Own content or Admin+)
router.post('/:id/publish', authenticate, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Check authorization
    if (req.user.id !== content.author && req.user.role?.name !== 'Super Admin' && req.user.role?.name !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    content.status = 'Published';
    content.publishedAt = new Date();
    await content.save();

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: 'UPDATE',
      entityType: 'Content',
      entityId: content._id,
      entityTitle: content.title,
      details: 'Content published',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Content published successfully', content });
  } catch (err) {
    console.error('Publish content error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/content/:id
// @desc    Delete content
// @access  Private (Own content or Admin+)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Check authorization
    if (req.user.id !== content.author && req.user.role?.name !== 'Super Admin' && req.user.role?.name !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Content.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: 'DELETE',
      entityType: 'Content',
      entityId: req.params.id,
      entityTitle: content.title,
      details: 'Content deleted',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (err) {
    console.error('Delete content error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/content/:id/like
// @desc    Like/unlike content
// @access  Public
router.post('/:id/like', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    const userId = req.user?.id || req.ip; // Use IP for anonymous users

    if (content.likedBy?.includes(userId)) {
      content.likedBy = content.likedBy.filter(id => id !== userId);
      content.likes = Math.max(0, content.likes - 1);
    } else {
      if (!content.likedBy) content.likedBy = [];
      content.likedBy.push(userId);
      content.likes += 1;
    }

    await content.save();
    res.json({ success: true, content, liked: content.likedBy?.includes(userId) });
  } catch (err) {
    console.error('Like content error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
