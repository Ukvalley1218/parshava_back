import Category from '../models/category.model.js';
import Subcategory from '../models/subcategory.model.js';
import Series from '../models/series.model.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, active, brand, brandId } = req.query;

    const query = {};

    // Filter by brand name or brand ObjectId
    if (brand || brandId) {
      // Get the Brand ObjectId to filter categories
      const Brand = (await import('../models/brand.model.js')).default;

      if (brandId) {
        // Direct ObjectId filter
        query.brands = brandId;
      } else if (brand) {
        // Find brand by name first, then filter categories
        const brandDoc = await Brand.findOne({
          name: { $regex: new RegExp(`^${brand}$`, 'i') }
        });

        if (brandDoc) {
          query.brands = brandDoc._id;
        } else {
          // Brand not found, return empty result
          return res.json({
            success: true,
            data: [],
            pagination: {
              totalItems: 0,
              totalPages: 0,
              currentPage: parseInt(page),
              limit: parseInt(limit)
            }
          });
        }
      }
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (active !== undefined) {
      query.active = active === 'true';
    }

    const total = await Category.countDocuments(query);
    const categories = await Category.find(query)
      .populate('brands', 'name')
     .sort({ createdAt: -1 }) // newest first
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

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Private
export const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).populate('brands', 'name');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
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

// @desc    Create category
// @route   POST /api/categories
// @access  Private (Admin)
export const createCategory = async (req, res, next) => {
  try {
    const { name, brands } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check for existing category
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = new Category({
      name: name.trim(),
      brands: brands || []
    });
    await category.save();

    // Populate brands before returning
    await category.populate('brands', 'name');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
export const updateCategory = async (req, res, next) => {
  try {
    const { name, active, brands } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (name !== undefined) {
      // Check for duplicate name
      const existing = await Category.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
      category.name = name.trim();
    }

    if (active !== undefined) {
      category.active = active;
    }

    if (brands !== undefined) {
      category.brands = brands;
    }

    await category.save();

    // Populate brands before returning
    await category.populate('brands', 'name');

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Delete all subcategories and series linked to this category
    await Subcategory.deleteMany({ category: category._id });
    await Series.deleteMany({ category: category._id });

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subcategories for a category
// @route   GET /api/categories/:id/subcategories
// @access  Private
export const getCategorySubcategories = async (req, res, next) => {
  try {
    const subcategories = await Subcategory.find({
      category: req.params.id,
      active: true
    }).sort({ createdAt: -1 }); // newest first;

    res.json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get series for a category
// @route   GET /api/categories/:id/series
// @access  Private
export const getCategorySeries = async (req, res, next) => {
  try {
    const series = await Series.find({
      category: req.params.id,
      active: true
    }).sort({ createdAt: -1 }); // newest first;

    res.json({
      success: true,
      data: series
    });
  } catch (error) {
    next(error);
  }
};