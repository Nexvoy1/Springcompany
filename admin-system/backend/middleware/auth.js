import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';

// Middleware to verify JWT and attach user to request
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('role');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Middleware to check if user has specific role
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const roleNames = allowedRoles.map(role => role.toLowerCase());
    const userRole = req.user.role?.name?.toLowerCase();

    if (!roleNames.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    next();
  };
};

// Middleware to check if user has specific permission
export const checkPermission = (feature, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const role = await Role.findById(req.user.role);
      if (!role) {
        return res.status(403).json({ success: false, message: 'Role not found' });
      }

      const hasPermission = role.permissions.some(
        perm => perm.feature === feature && perm.actions.includes(action)
      );

      if (!hasPermission && role.name !== 'Super Admin') {
        return res.status(403).json({ success: false, message: `No permission to ${action} ${feature}` });
      }

      next();
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error checking permissions' });
    }
  };
};

// Middleware for Super Admin only
export const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  if (req.user.role?.name !== 'Super Admin') {
    return res.status(403).json({ success: false, message: 'Only super admins can access this' });
  }

  next();
};

// Middleware for rate limiting per user
const userRequestCounts = new Map();
export const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(); // Skip rate limiting for unauthenticated requests
    }

    const userId = req.user.id;
    const key = `${userId}:${Math.floor(Date.now() / windowMs)}`;
    const count = userRequestCounts.get(key) || 0;

    if (count >= maxRequests) {
      return res.status(429).json({ success: false, message: 'Too many requests, try again later' });
    }

    userRequestCounts.set(key, count + 1);

    // Clean up old entries to prevent memory leak
    if (userRequestCounts.size > 10000) {
      const currentWindow = Math.floor(Date.now() / windowMs);
      for (const [storedKey] of userRequestCounts) {
        const storedWindow = parseInt(storedKey.split(':')[1]);
        if (storedWindow < currentWindow - 1) {
          userRequestCounts.delete(storedKey);
        }
      }
    }

    next();
  };
};
