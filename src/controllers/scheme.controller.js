import schemeService from '../services/scheme.service.js';

// @desc    Create a new scheme
// @route   POST /api/schemes
// @access  Private
export const createScheme = async (req, res, next) => {
  try {
    const scheme = await schemeService.createScheme(req.body, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Scheme created successfully',
      data: scheme
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all schemes with pagination and filters
// @route   GET /api/schemes
// @access  Private
export const getSchemes = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;

    const result = await schemeService.getSchemes({
      page: page || 1,
      limit: limit || 10,
      status: status || ''
    });

    res.json({
      success: true,
      data: result.schemes,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get scheme by ID
// @route   GET /api/schemes/:id
// @access  Private
export const getSchemeById = async (req, res, next) => {
  try {
    const scheme = await schemeService.getSchemeById(req.params.id);

    res.json({
      success: true,
      data: scheme
    });
  } catch (error) {
    if (error.message === 'Scheme not found') {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found'
      });
    }
    next(error);
  }
};

// @desc    Update scheme
// @route   PATCH /api/schemes/:id
// @access  Private
export const updateScheme = async (req, res, next) => {
  try {
    const scheme = await schemeService.updateScheme(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Scheme updated successfully',
      data: scheme
    });
  } catch (error) {
    if (error.message === 'Scheme not found') {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found'
      });
    }
    next(error);
  }
};

// @desc    Delete scheme (soft delete)
// @route   DELETE /api/schemes/:id
// @access  Private
export const deleteScheme = async (req, res, next) => {
  try {
    await schemeService.deleteScheme(req.params.id);

    res.json({
      success: true,
      message: 'Scheme deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Scheme not found') {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found'
      });
    }
    next(error);
  }
};

// @desc    Get active schemes
// @route   GET /api/schemes/active
// @access  Private
export const getActiveSchemes = async (req, res, next) => {
  try {
    const schemes = await schemeService.getActiveSchemes();

    res.json({
      success: true,
      count: schemes.length,
      data: schemes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get schemes for a specific product
// @route   GET /api/schemes/product/:productId
// @access  Private
export const getProductSchemes = async (req, res, next) => {
  try {
    const schemes = await schemeService.getProductSchemes(req.params.productId);

    res.json({
      success: true,
      count: schemes.length,
      data: schemes
    });
  } catch (error) {
    next(error);
  }
};