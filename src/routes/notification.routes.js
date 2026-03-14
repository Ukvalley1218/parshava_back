import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', getUnreadCount);

// @route   GET /api/notifications
// @desc    Get all notifications for user
// @access  Private
router.get('/', getNotifications);

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.patch('/read-all', markAllAsRead);

// @route   PATCH /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.patch('/:id/read', markAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', deleteNotification);

export default router;