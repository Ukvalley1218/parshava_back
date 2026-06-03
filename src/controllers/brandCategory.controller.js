import BrandCategory from '../models/brandCategory.model.js';

// @desc    Get all brand categories
// @route   GET /api/brand-categories
// @access  Private
export const getBrandCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, active } = req.query;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (active !== undefined) {
      query.active = active === 'true';
    }

    const total = await BrandCategory.countDocuments(query);
    const categories = await BrandCategory.find(query)
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

// @desc    Get brand category by ID
// @route   GET /api/brand-categories/:id
// @access  Private
export const getBrandCategoryById = async (req, res, next) => {
  try {
    const category = await BrandCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Brand category not found'
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

// @desc    Create brand category
// @route   POST /api/brand-categories
// @access  Private (Admin)
export const createBrandCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Brand category name is required'
      });
    }

    // Check for existing category
    const existing = await BrandCategory.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Brand category with this name already exists'
      });
    }

    const category = new BrandCategory({
      name: name.trim(),
      description: description?.trim() || ''
    });
    await category.save();

    res.status(201).json({
      success: true,
      message: 'Brand category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update brand category
// @route   PUT /api/brand-categories/:id
// @access  Private (Admin)
export const updateBrandCategory = async (req, res, next) => {
  try {
    const { name, description, active } = req.body;
    const category = await BrandCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Brand category not found'
      });
    }

    if (name !== undefined) {
      // Check for duplicate name
      const existing = await BrandCategory.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Brand category with this name already exists'
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
      message: 'Brand category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete brand category
// @route   DELETE /api/brand-categories/:id
// @access  Private (Admin)
export const deleteBrandCategory = async (req, res, next) => {
  try {
    const category = await BrandCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Brand category not found'
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Brand category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};