import Scheme from '../models/scheme.model.js';
import { createNotification } from './notification.service.js';

class SchemeService {
  /**
   * Create a new scheme
   * @param {Object} data - Scheme data
   * @param {String} userId - User ID creating the scheme
   * @returns {Object} Created scheme
   */
  async createScheme(data, userId) {
    const scheme = await Scheme.create({
      ...data,
      createdBy: userId
    });

    const populatedScheme = await scheme.populate('products', 'name hsn gstRate');

    // Create notification for new scheme
    try {
      await createNotification({
        title: 'New Scheme Available',
        message: `${scheme.title} is now active`,
        type: 'scheme'
      });
    } catch (error) {
      console.error('Notification failed:', error.message);
    }

    return populatedScheme;
  }

  /**
   * Get all schemes with pagination and filters
   * @param {Object} options - Query options
   * @returns {Object} Schemes with pagination info
   */
  async getSchemes({ page = 1, limit = 10, status = '' }) {
    const query = { isDeleted: false };

    // Filter by status
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [schemes, total] = await Promise.all([
      Scheme.find(query)
        .populate('products', 'name hsn gstRate')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Scheme.countDocuments(query)
    ]);

    return {
      schemes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    };
  }

  /**
   * Get scheme by ID
   * @param {String} schemeId - Scheme ID
   * @returns {Object} Scheme details
   */
  async getSchemeById(schemeId) {
    const scheme = await Scheme.findOne({
      _id: schemeId,
      isDeleted: false
    })
      .populate('products', 'name hsn gstRate mrp')
      .populate('createdBy', 'name email');

    if (!scheme) {
      throw new Error('Scheme not found');
    }

    return scheme;
  }

  /**
   * Update scheme
   * @param {String} schemeId - Scheme ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated scheme
   */
  async updateScheme(schemeId, updateData) {
    const scheme = await Scheme.findOneAndUpdate(
      { _id: schemeId, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('products', 'name hsn gstRate')
      .populate('createdBy', 'name email');

    if (!scheme) {
      throw new Error('Scheme not found');
    }

    return scheme;
  }

  /**
   * Soft delete scheme
   * @param {String} schemeId - Scheme ID
   * @returns {Boolean} Success status
   */
  async deleteScheme(schemeId) {
    const scheme = await Scheme.findOneAndUpdate(
      { _id: schemeId, isDeleted: false },
      { isDeleted: true, status: 'inactive' },
      { new: true }
    );

    if (!scheme) {
      throw new Error('Scheme not found');
    }

    return true;
  }

  /**
   * Get active schemes
   * @returns {Array} Active schemes
   */
  async getActiveSchemes() {
    const today = new Date();

    const schemes = await Scheme.find({
      status: 'active',
      startDate: { $lte: today },
      endDate: { $gte: today },
      isDeleted: false
    })
      .populate('products', 'name hsn gstRate mrp')
      .sort({ createdAt: -1 });

    return schemes;
  }

  /**
   * Get schemes for a specific product
   * @param {String} productId - Product ID
   * @returns {Array} Schemes applicable to the product
   */
  async getProductSchemes(productId) {
    const today = new Date();

    const schemes = await Scheme.find({
      products: productId,
      status: 'active',
      startDate: { $lte: today },
      endDate: { $gte: today },
      isDeleted: false
    })
      .populate('products', 'name hsn gstRate mrp')
      .sort({ createdAt: -1 });

    return schemes;
  }
}

export default new SchemeService();