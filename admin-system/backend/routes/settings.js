import express from 'express';
import Setting from '../models/Setting.js';
import ActivityLog from '../models/ActivityLog.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validationResult, body } from 'express-validator';

const router = express.Router();

// @route   GET /api/settings
// @desc    Get all settings
// @access  Private (Admin+) / Public for non-sensitive settings
router.get('/', async (req, res) => {
  try {
    let settings;
    
    if (req.user && (req.user.role?.name === 'Super Admin' || req.user.role?.name === 'Admin')) {
      // Admins see all settings
      settings = await Setting.find();
    } else {
      // Public users see only non-sensitive settings
      settings = await Setting.find({ category: { $ne: 'Security' } });
    }

    res.json({ success: true, settings });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/settings/:key
// @desc    Get setting by key
// @access  Private (Admin+)
router.get('/:key', authenticate, authorize('Super Admin', 'Admin'), async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key }).populate('updatedBy', 'firstName lastName email');
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }
    res.json({ success: true, setting });
  } catch (err) {
    console.error('Get setting error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/settings
// @desc    Create new setting
// @access  Private (Super Admin only)
router.post(
  '/',
  authenticate,
  authorize('Super Admin'),
  [
    body('key').trim().toLowerCase().notEmpty().withMessage('Setting key is required'),
    body('value').exists().withMessage('Value is required'),
    body('type').isIn(['String', 'Number', 'Boolean', 'JSON']).withMessage('Invalid type'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { key, value, type, description, category } = req.body;

      // Check if setting already exists
      const existingSetting = await Setting.findOne({ key });
      if (existingSetting) {
        return res.status(400).json({ success: false, message: 'Setting already exists' });
      }

      const newSetting = new Setting({
        key,
        value,
        type,
        description,
        category,
        updatedBy: req.user.id,
      });

      await newSetting.save();

      // Log activity
      await ActivityLog.create({
        user: req.user.id,
        action: 'CREATE',
        entityType: 'Setting',
        entityId: newSetting._id,
        entityTitle: key,
        details: `Setting created: ${key}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json({ success: true, message: 'Setting created', setting: newSetting });
    } catch (err) {
      console.error('Create setting error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   PUT /api/settings/:key
// @desc    Update setting
// @access  Private (Super Admin only)
router.put(
  '/:key',
  authenticate,
  authorize('Super Admin'),
  [body('value').exists().withMessage('Value is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const setting = await Setting.findOne({ key: req.params.key });
      if (!setting) {
        return res.status(404).json({ success: false, message: 'Setting not found' });
      }

      const oldValue = setting.value;
      const { value, type, description } = req.body;

      setting.value = value;
      if (type) setting.type = type;
      if (description) setting.description = description;
      setting.updatedBy = req.user.id;

      await setting.save();

      // Log activity
      await ActivityLog.create({
        user: req.user.id,
        action: 'UPDATE',
        entityType: 'Setting',
        entityId: setting._id,
        entityTitle: setting.key,
        changes: { value: `${oldValue} → ${value}` },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ success: true, message: 'Setting updated', setting });
    } catch (err) {
      console.error('Update setting error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   DELETE /api/settings/:key
// @desc    Delete setting
// @access  Private (Super Admin only)
router.delete('/:key', authenticate, authorize('Super Admin'), async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }

    await Setting.deleteOne({ key: req.params.key });

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: 'DELETE',
      entityType: 'Setting',
      entityId: setting._id,
      entityTitle: setting.key,
      details: 'Setting deleted',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Setting deleted' });
  } catch (err) {
    console.error('Delete setting error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
