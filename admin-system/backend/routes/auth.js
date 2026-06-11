import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { validationResult, body } from 'express-validator';
import ActivityLog from '../models/ActivityLog.js';

const router = express.Router();

// Helper function to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

// Helper function to log activities
const logActivity = async (userId, action, entityType, entityId, details = '', status = 'Success', req) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      entityType,
      entityId,
      details,
      status,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { firstName, lastName, email, password } = req.body;

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }

      // Create new user
      user = new User({
        firstName,
        lastName,
        email,
        password,
        role: '65d7cd5e8a1b2c3d4e5f6g7h', // Default to 'User' role - adjust ID as needed
      });

      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user._id);

      // Log activity
      await logActivity(user._id, 'CREATE', 'User', user._id, 'User registered', 'Success', req);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ success: false, message: 'Server error during registration' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').exists().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email }).select('+password');
      if (!user || !user.isActive) {
        await logActivity(null, 'LOGIN', 'User', user?._id || 'unknown', 'Failed login attempt', 'Failed', req);
        return res.status(401).json({ success: false, message: 'Invalid credentials or account inactive' });
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        await logActivity(user._id, 'LOGIN', 'User', user._id, 'Account locked - too many failed attempts', 'Failed', req);
        return res.status(403).json({ success: false, message: 'Account locked. Try again later.' });
      }

      // Match password
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        user.loginAttempts += 1;
        if (user.loginAttempts >= 5) {
          user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
        }
        await user.save();
        await logActivity(user._id, 'LOGIN', 'User', user._id, 'Failed login attempt', 'Failed', req);
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Reset login attempts on successful login
      user.loginAttempts = 0;
      user.lockedUntil = null;
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user._id);

      // Log activity
      await logActivity(user._id, 'LOGIN', 'User', user._id, 'User logged in', 'Success', req);

      res.json({
        success: true,
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: 'Server error during login' });
    }
  }
);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token using refresh token
// @access  Public
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);
      res.json({
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private (authenticated)
router.post('/logout', async (req, res) => {
  try {
    // In a JWT-based system, logout is typically client-side (token deletion)
    // But we can log the activity on the server
    if (req.user) {
      await logActivity(req.user.id, 'LOGOUT', 'User', req.user.id, 'User logged out', 'Success', req);
    }
    res.json({ success: true, message: 'Logout successful' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private (authenticated)
router.post(
  '/change-password',
  [
    body('currentPassword').exists().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => value === req.body.newPassword).withMessage('Passwords do not match'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const user = await User.findById(req.user.id).select('+password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isMatch = await user.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        await logActivity(req.user.id, 'UPDATE', 'User', req.user.id, 'Failed password change attempt', 'Failed', req);
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      user.password = req.body.newPassword;
      await user.save();

      await logActivity(req.user.id, 'UPDATE', 'User', req.user.id, 'Password changed successfully', 'Success', req);

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
      console.error('Change password error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        // Don't reveal if email exists - security best practice
        return res.json({ success: true, message: 'If email exists, reset link sent' });
      }

      // TODO: Generate reset token, save to user, send email
      await logActivity(user._id, 'UPDATE', 'User', user._id, 'Password reset requested', 'Success', req);

      res.json({ success: true, message: 'If email exists, reset link sent' });
    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

export default router;
