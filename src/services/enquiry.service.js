import Enquiry from '../models/enquiry.model.js';
import Customer from '../models/customer.model.js';
import Inquiry from '../models/inquiry.model.js';

// Migrate old relatedQuotation (single) to relatedQuotations (array)
Enquiry.find({ relatedQuotation: { $exists: true, $ne: null }, relatedQuotations: { $exists: false } })
  .then(async (oldDocs) => {
    for (const doc of oldDocs) {
      if (doc.relatedQuotation && (!doc.relatedQuotations || doc.relatedQuotations.length === 0)) {
        await Enquiry.updateOne(
          { _id: doc._id },
          { $set: { relatedQuotations: [doc.relatedQuotation] } }
        );
      }
    }
  })
  .catch(() => {});

class EnquiryService {
  /**
   * Create a new enquiry
   * @param {String} userId - User creating the enquiry
   * @param {Object} data - { customerId, contactPerson, description }
   * @returns {Object} Created enquiry
   */
  async createEnquiry(userId, data) {
    const { customerId, contactPerson, description } = data;

    const customer = await Customer.findById(customerId).populate('accountManager', 'name email phone role');

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Auto-fill customer details
    const customerDetails = {
      firmName: customer.firmName || customer.name || 'Unknown',
      name: customer.name || customer.firmName || 'Unknown',
      mobile: customer.mobile,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      gstin: customer.gstin
    };

    // Auto-fill account manager from customer
    let accountManager = null;
    if (customer.accountManager && customer.accountManager.length > 0) {
      accountManager = customer.accountManager[0]._id;
    }

    // Generate enquiry ID
    const enquiryCount = await Enquiry.countDocuments();
    const enquiryId = `ENQ${String(enquiryCount + 1).padStart(6, '0')}`;

    const enquiry = await Enquiry.create({
      enquiryId,
      customerId,
      customerDetails,
      contactPerson: contactPerson || undefined,
      accountManager,
      description,
      createdBy: userId,
      assignedTo: accountManager
    });

    return Enquiry.findById(enquiry._id)
      .populate('customerId', 'name firmName mobile email city state priceListCategory accountManager')
      .populate('accountManager', 'name email phone role')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('relatedQuotations');
  }

  /**
   * Get all enquiries with pagination and filters
   * @param {Object} options - { page, limit, status, userId, userRole }
   * @returns {Object} Enquiries with pagination
   */
  async getEnquiries({ page = 1, limit = 20, status = '', userId, userRole }) {
    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Non-admin users only see their own enquiries (created by them or assigned to them)
    if (userId && userRole !== 'admin' && userRole !== 'superadmin') {
      query.$or = [
        { createdBy: userId },
        { assignedTo: userId }
      ];
    }

    const skip = (page - 1) * limit;
    const [enquiries, total] = await Promise.all([
      Enquiry.find(query)
        .populate('customerId', 'name firmName mobile email city state priceListCategory accountManager')
        .populate('accountManager', 'name email phone role')
        .populate('assignedTo', 'name email role')
        .populate('createdBy', 'name email')
        .populate('relatedQuotations')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Enquiry.countDocuments(query)
    ]);

    return {
      enquiries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Get enquiry by ID
   * @param {String} id - Enquiry ID
   * @param {String} userId - User ID (for authorization)
   * @param {String} userRole - User role
   * @returns {Object} Enquiry
   */
  async getEnquiryById(id, userId, userRole) {
    const enquiry = await Enquiry.findById(id)
      .populate('customerId', 'name firmName mobile email address city state gstin priceListCategory accountManager contactPersons')
      .populate('accountManager', 'name email phone role')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('relatedQuotations');

    if (!enquiry) {
      throw new Error('Enquiry not found');
    }

    // Non-admin users can only see their own enquiries
    if (userId && userRole !== 'admin' && userRole !== 'superadmin') {
      const isCreator = enquiry.createdBy?._id?.toString() === userId.toString();
      const isAssignee = enquiry.assignedTo?._id?.toString() === userId.toString();
      if (!isCreator && !isAssignee) {
        throw new Error('Not authorized to view this enquiry');
      }
    }

    return enquiry;
  }

  /**
   * Update an enquiry
   * @param {String} id - Enquiry ID
   * @param {Object} data - Update data
   * @returns {Object} Updated enquiry
   */
  async updateEnquiry(id, data) {
    const enquiry = await Enquiry.findById(id);

    if (!enquiry) {
      throw new Error('Enquiry not found');
    }

    // Only allow updating certain fields
    const allowedUpdates = ['description', 'status', 'notes', 'contactPerson', 'assignedTo'];
    for (const key of allowedUpdates) {
      if (data[key] !== undefined) {
        enquiry[key] = data[key];
      }
    }

    await enquiry.save();

    return Enquiry.findById(id)
      .populate('customerId', 'name firmName mobile email city state priceListCategory accountManager')
      .populate('accountManager', 'name email phone role')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('relatedQuotations');
  }

  /**
   * Link a quotation (Inquiry) to an enquiry
   * @param {String} enquiryId - Enquiry ID
   * @param {String} quotationId - Inquiry/Quotation ID
   * @returns {Object} Updated enquiry
   */
  async linkQuotation(enquiryId, quotationId) {
    const enquiry = await Enquiry.findById(enquiryId);

    if (!enquiry) {
      throw new Error('Enquiry not found');
    }

    // Verify the quotation exists
    const quotation = await Inquiry.findById(quotationId);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    // Add quotation to the array if not already linked
    if (!enquiry.relatedQuotations) {
      enquiry.relatedQuotations = [];
    }
    if (!enquiry.relatedQuotations.includes(quotationId)) {
      enquiry.relatedQuotations.push(quotationId);
    }
    enquiry.status = 'quoted';

    await enquiry.save();

    return Enquiry.findById(enquiryId)
      .populate('customerId', 'name firmName mobile email address city state gstin priceListCategory accountManager contactPersons')
      .populate('accountManager', 'name email phone role')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('relatedQuotations');
  }

  /**
   * Delete an enquiry (soft delete - set status to closed)
   * @param {String} id - Enquiry ID
   * @returns {Object} Deleted enquiry
   */
  async deleteEnquiry(id) {
    const enquiry = await Enquiry.findById(id);

    if (!enquiry) {
      throw new Error('Enquiry not found');
    }

    enquiry.status = 'closed';
    await enquiry.save();

    return enquiry;
  }

  /**
   * Get enquiry counts by status
   * @param {String} userId - User ID
   * @param {String} userRole - User role
   * @returns {Object} Status counts
   */
  async getEnquiryCounts(userId, userRole) {
    const baseQuery = {};

    // Non-admin users only see their own enquiries
    if (userId && userRole !== 'admin' && userRole !== 'superadmin') {
      baseQuery.$or = [
        { createdBy: userId },
        { assignedTo: userId }
      ];
    }

    const [open, inProgress, quoted, closed] = await Promise.all([
      Enquiry.countDocuments({ ...baseQuery, status: 'open' }),
      Enquiry.countDocuments({ ...baseQuery, status: 'in_progress' }),
      Enquiry.countDocuments({ ...baseQuery, status: 'quoted' }),
      Enquiry.countDocuments({ ...baseQuery, status: 'closed' })
    ]);

    return { open, inProgress, quoted, closed };
  }
}

export default new EnquiryService();