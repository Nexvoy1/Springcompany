import express from 'express';
import User from '../models/User.js';
import Role from '../models/Role.js';
import ActivityLog from '../models/ActivityLog.js';
import { authenticate, authorize, checkPermission } from '../middleware/auth.js';
import { validationResult, body } from 'express-validator';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users with pagination
// @access  Private (Admin+)
router.get('/', authenticate, authorize('Super Admin', 'Admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('role', 'name level')
      .limit(limit * 1)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Own profile or Admin+)
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Allow users to view their own profile or admins to view any profile
    if (req.user.id !== req.params.id && req.user.role?.name !== 'Super Admin' && req.user.role?.name !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this profile' });
    }

    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('role');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Own profile or Admin+)
router.put(
  '/:id',
  authenticate,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('phone').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Check authorization
      if (req.user.id !== req.params.id && req.user.role?.name !== 'Super Admin' && req.user.role?.name !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to update this user' });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Store old values for tracking changes
      const changes = {};
      const { firstName, lastName, email, phone, avatar } = req.body;

      if (firstName && firstName !== user.firstName) {
        changes.firstName = `${user.firstName} → ${firstName}`;
        user.firstName = firstName;
      }
      if (lastName && lastName !== user.lastName) {
        changes.lastName = `${user.lastName} → ${lastName}`;
        user.lastName = lastName;
      }
      if (email && email !== user.email) {
        changes.email = `${user.email} → ${email}`;
        user.email = email;
      }
      if (phone && phone !== user.phone) {
        changes.phone = `${user.phone} → ${phone}`;
        user.phone = phone;
      }
      if (avatar && avatar !== user.avatar) {
        changes.avatar = 'Avatar updated';
        user.avatar = avatar;
      }

      await user.save();

      // Log activity
      await ActivityLog.create({
        user: req.user.id,
        action: 'UPDATE',
        entityType: 'User',
        entityId: user._id,
        changes: changes,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ success: true, message: 'User updated successfully', user });
    } catch (err) {
      console.error('Update user error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   PUT /api/users/:id/role
// @desc    Change user role
// @access  Private (Super Admin only)
router.put(
  '/:id/role',
  authenticate,
  authorize('Super Admin'),
  [body('roleId').notEmpty().withMessage('Role ID is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const role = await Role.findById(req.body.roleId);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      const oldRole = user.role;
      user.role = req.body.roleId;
      await user.save();

      // Log activity
      await ActivityLog.create({
        user: req.user.id,
        action: 'UPDATE',
        entityType: 'User',
        entityId: user._id,
        changes: { role: `${oldRole} → ${role.name}` },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ success: true, message: 'User role updated successfully', user });
    } catch (err) {
      console.error('Update user role error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   PUT /api/users/:id/toggle-active
// @desc    Toggle user active status
// @access  Private (Super Admin only)
router.put('/:id/toggle-active', authenticate, authorize('Super Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: 'UPDATE',
      entityType: 'User',
      entityId: user._id,
      details: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (err) {
    console.error('Toggle user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Soft delete user
// @access  Private (Super Admin only)
router.delete('/:id', authenticate, authorize('Super Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Soft delete - mark as deleted
    user.isDeleted = true;
    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: 'DELETE',
      entityType: 'User',
      entityId: user._id,
      details: 'User deleted (soft delete)',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/users/:id/activity
// @desc    Get user activity logs
// @access  Private (Own activity or Admin+)
router.get('/:id/activity', authenticate, async (req, res) => {
  try {
    // Check authorization
    if (req.user.id !== req.params.id && req.user.role?.name !== 'Super Admin' && req.user.role?.name !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find({ user: req.params.id })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await ActivityLog.countDocuments({ user: req.params.id });

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (err) {
    console.error('Get user activity error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
