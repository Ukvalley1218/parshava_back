import notificationService from '../services/notification.service.js';

// @desc    Get notifications for user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, unreadOnly } = req.query;

    const result = await notificationService.getNotifications(req.user._id, {
      page: page || 1,
      limit: limit || 20,
      unreadOnly: unreadOnly === 'true'
    });

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res, next) => {
  try {
    const count = await notificationService.markAllAsRead(req.user._id);

    res.json({
      success: true,
      message: `${count} notifications marked as read`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user._id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    next(error);
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    next(error);
  }
};