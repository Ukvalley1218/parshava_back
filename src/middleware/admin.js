import User from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';

/**
 * Admin authorization middleware
 * Verifies JWT token and checks if user has admin role
 */
export const adminAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // Check if user has admin role
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token verification failed.'
    });
  }
};

/**
 * Optional admin auth - doesn't block but adds user if authenticated
 */
export const optionalAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (decoded && (decoded.role === 'admin' || decoded.role === 'superadmin')) {
      req.user = {
        _id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};