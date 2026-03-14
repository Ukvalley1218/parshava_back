import Notification from '../models/notification.model.js';

/**
 * Create a new notification
 * @param {Object} data - Notification data
 * @param {String} data.title - Notification title
 * @param {String} data.message - Notification message
 * @param {String} data.type - Notification type (system, order, scheme, customer)
 * @param {String} [data.userId] - User ID (optional, for user-specific notifications)
 * @returns {Object} Created notification
 */
export const createNotification = async (data) => {
  try {
    const notification = await Notification.create({
      title: data.title,
      message: data.message,
      type: data.type || 'system',
      userId: data.userId || null
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    // Don't throw error - notifications should not break main operations
    return null;
  }
};

class NotificationService {
  /**
   * Get notifications for a user
   * @param {String} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} Notifications with pagination
   */
  async getNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
    const query = { userId };

    if (unreadOnly) {
      query.isRead = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, isRead: false })
    ]);

    return {
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      unreadCount
    };
  }

  /**
   * Mark notification as read
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID
   * @returns {Object} Updated notification
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   * @param {String} userId - User ID
   * @returns {Number} Number of notifications updated
   */
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return result.modifiedCount;
  }

  /**
   * Delete a notification
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID
   * @returns {Boolean} Success status
   */
  async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return true;
  }

  /**
   * Get unread notification count for a user
   * @param {String} userId - User ID
   * @returns {Number} Unread count
   */
  async getUnreadCount(userId) {
    return Notification.countDocuments({ userId, isRead: false });
  }
}

export default new NotificationService();