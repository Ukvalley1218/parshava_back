import enquiryService from '../services/enquiry.service.js';

// @desc    Create a new enquiry
// @route   POST /api/enquiries
// @access  Private
export const createEnquiry = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.createEnquiry(req.user._id, req.body);

    res.status(201).json({
      success: true,
      message: 'Enquiry created successfully',
      data: enquiry
    });
  } catch (error) {
    if (error.message === 'Customer not found') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    next(error);
  }
};

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Private
export const getEnquiries = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;

    const result = await enquiryService.getEnquiries({
      page: page || 1,
      limit: limit || 20,
      status: status || '',
      userId: req.user._id,
      userRole: req.user.role
    });

    res.json({
      success: true,
      data: result.enquiries,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get enquiry by ID
// @route   GET /api/enquiries/:id
// @access  Private
export const getEnquiryById = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.getEnquiryById(
      req.params.id,
      req.user._id,
      req.user.role
    );

    res.json({
      success: true,
      data: enquiry
    });
  } catch (error) {
    if (error.message === 'Enquiry not found') {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }
    if (error.message === 'Not authorized to view this enquiry') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this enquiry'
      });
    }
    next(error);
  }
};

// @desc    Update enquiry
// @route   PATCH /api/enquiries/:id
// @access  Private
export const updateEnquiry = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.updateEnquiry(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Enquiry updated successfully',
      data: enquiry
    });
  } catch (error) {
    if (error.message === 'Enquiry not found') {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }
    next(error);
  }
};

// @desc    Delete enquiry (soft delete)
// @route   DELETE /api/enquiries/:id
// @access  Private
export const deleteEnquiry = async (req, res, next) => {
  try {
    await enquiryService.deleteEnquiry(req.params.id);

    res.json({
      success: true,
      message: 'Enquiry deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Enquiry not found') {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }
    next(error);
  }
};

// @desc    Link a quotation to an enquiry
// @route   POST /api/enquiries/:id/link-quotation
// @access  Private
export const linkQuotation = async (req, res, next) => {
  try {
    const { quotationId } = req.body;

    const enquiry = await enquiryService.linkQuotation(req.params.id, quotationId);

    res.json({
      success: true,
      message: 'Quotation linked to enquiry successfully',
      data: enquiry
    });
  } catch (error) {
    if (error.message === 'Enquiry not found') {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }
    if (error.message === 'Quotation not found') {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }
    next(error);
  }
};

// @desc    Get enquiry counts by status
// @route   GET /api/enquiries/counts
// @access  Private
export const getEnquiryCounts = async (req, res, next) => {
  try {
    const counts = await enquiryService.getEnquiryCounts(req.user._id, req.user.role);

    res.json({
      success: true,
      data: counts
    });
  } catch (error) {
    next(error);
  }
};