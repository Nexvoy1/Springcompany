import express from 'express';
import Role from '../models/Role.js';
import ActivityLog from '../models/ActivityLog.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validationResult, body } from 'express-validator';

const router = express.Router();

// @route   GET /api/roles
// @desc    Get all roles
// @access  Private (Admin+)
router.get('/', authenticate, authorize('Super Admin', 'Admin'), async (req, res) => {
  try {
    const roles = await Role.find().sort({ level: -1 });
    res.json({ success: true, roles });
  } catch (err) {
    console.error('Get roles error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/roles/:id
// @desc    Get role by ID
// @access  Private (Admin+)
router.get('/:id', authenticate, authorize('Super Admin', 'Admin'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    res.json({ success: true, role });
  } catch (err) {
    console.error('Get role error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/roles
// @desc    Create new role
// @access  Private (Super Admin only)
router.post(
  '/',
  authenticate,
  authorize('Super Admin'),
  [
    body('name').trim().notEmpty().withMessage('Role name is required'),
    body('permissions').isArray().withMessage('Permissions must be an array'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, permissions, description } = req.body;

      // Check if role already exists
      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return res.status(400).json({ success: false, message: 'Role already exists' });
      }

      const newRole = new Role({
        name,
        permissions,
        description,
        level: Math.floor(Math.random() * 100),
      });

      await newRole.save();

      // Log activity
      await ActivityLog.create({
        user: req.user.id,
        action: 'CREATE',
        entityType: 'Role',
        entityId: newRole._id,
        entityTitle: name,
        details: `Role created: ${name}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json({ success: true, message: 'Role created successfully', role: newRole });
    } catch (err) {
      console.error('Create role error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   PUT /api/roles/:id
// @desc    Update role
// @access  Private (Super Admin only)
router.put(
  '/:id',
  authenticate,
  authorize('Super Admin'),
  [
    body('name').optional().trim().notEmpty(),
    body('permissions').optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const role = await Role.findById(req.params.id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      const changes = {};
      const { name, permissions, description } = req.body;

      if (name && name !== role.name) {
        changes.name = `${role.name} → ${name}`;
        role.name = name;
      }
      if (permissions) {
        changes.permissions = 'Permissions updated';
        role.permissions = permissions;
      }
      if (description && description !== role.description) {
        changes.description = `${role.description} → ${description}`;
        role.description = description;
      }

      await role.save();

      // Log activity
      await ActivityLog.create({
        user: req.user.id,
        action: 'UPDATE',
        entityType: 'Role',
        entityId: role._id,
        entityTitle: role.name,
        changes: changes,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ success: true, message: 'Role updated successfully', role });
    } catch (err) {
      console.error('Update role error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   DELETE /api/roles/:id
// @desc    Delete role
// @access  Private (Super Admin only)
router.delete('/:id', authenticate, authorize('Super Admin'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    // Prevent deletion of core roles
    if (['Super Admin', 'User'].includes(role.name)) {
      return res.status(400).json({ success: false, message: 'Cannot delete core roles' });
    }

    await Role.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: 'DELETE',
      entityType: 'Role',
      entityId: req.params.id,
      entityTitle: role.name,
      details: 'Role deleted',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (err) {
    console.error('Delete role error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
