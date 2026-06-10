import Category from '../models/category.model.js';
import Subcategory from '../models/subcategory.model.js';
import Series from '../models/series.model.js';
import Product from '../models/product.model.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, active, brand } = req.query;

    // If brand is provided, get categories that have products for that brand
    if (brand) {
      const categoryNames = await Product.distinct('category', {
        brand: { $regex: new RegExp(`^${brand}$`, 'i') },
        active: { $ne: false }
      });

      // Get category documents for the found category names
      const query = {
        name: { $in: categoryNames }
      };

      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      if (active !== undefined) {
        query.active = active === 'true';
      }

      const total = await Category.countDocuments(query);
      const categories = await Category.find(query)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      return res.json({
        success: true,
        data: categories,
        pagination: {
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      });
    }

    // Original behavior - get all categories
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (active !== undefined) {
      query.active = active === 'true';
    }

    const total = await Category.countDocuments(query);
    const categories = await Category.find(query)
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

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Private
export const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

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
    const { name } = req.body;

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

    const category = new Category({ name: name.trim() });
    await category.save();

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
    const { name, active } = req.body;
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

    await category.save();

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
    }).sort({ name: 1 });

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
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: series
    });
  } catch (error) {
    next(error);
  }
};