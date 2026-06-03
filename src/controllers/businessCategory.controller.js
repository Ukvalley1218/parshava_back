import BusinessCategory from '../models/businessCategory.model.js';

// @desc    Get all business categories
// @route   GET /api/business-categories
// @access  Private
export const getBusinessCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, active } = req.query;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (active !== undefined) {
      query.active = active === 'true';
    }

    const total = await BusinessCategory.countDocuments(query);
    const categories = await BusinessCategory.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: categories,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get business category by ID
// @route   GET /api/business-categories/:id
// @access  Private
export const getBusinessCategoryById = async (req, res, next) => {
  try {
    const category = await BusinessCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Business category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create business category
// @route   POST /api/business-categories
// @access  Private (Admin)
export const createBusinessCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Business category name is required'
      });
    }

    // Check for existing category
    const existing = await BusinessCategory.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Business category with this name already exists'
      });
    }

    const category = new BusinessCategory({
      name: name.trim(),
      description: description?.trim() || ''
    });
    await category.save();

    res.status(201).json({
      success: true,
      message: 'Business category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update business category
// @route   PUT /api/business-categories/:id
// @access  Private (Admin)
export const updateBusinessCategory = async (req, res, next) => {
  try {
    const { name, description, active } = req.body;
    const category = await BusinessCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Business category not found'
      });
    }

    if (name !== undefined) {
      // Check for duplicate name
      const existing = await BusinessCategory.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Business category with this name already exists'
        });
      }
      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    if (active !== undefined) {
      category.active = active;
    }

    await category.save();

    res.json({
      success: true,
      message: 'Business category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete business category
// @route   DELETE /api/business-categories/:id
// @access  Private (Admin)
export const deleteBusinessCategory = async (req, res, next) => {
  try {
    const category = await BusinessCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Business category not found'
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Business category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};