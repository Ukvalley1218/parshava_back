import Subcategory from '../models/subcategory.model.js';
import Category from '../models/category.model.js';

// @desc    Get all subcategories
// @route   GET /api/subcategories
// @access  Private
export const getSubcategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, category, active } = req.query;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    if (active !== undefined) {
      query.active = active === 'true';
    }

    const total = await Subcategory.countDocuments(query);
    const subcategories = await Subcategory.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 }) // newest first
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: subcategories,
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

// @desc    Get subcategory by ID
// @route   GET /api/subcategories/:id
// @access  Private
export const getSubcategoryById = async (req, res, next) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id).populate('category', 'name');

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    res.json({
      success: true,
      data: subcategory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create subcategory
// @route   POST /api/subcategories
// @access  Private (Admin)
export const createSubcategory = async (req, res, next) => {
  try {
    const { name, category } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory name is required'
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    // Verify category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check for existing subcategory in this category
    const existing = await Subcategory.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      category
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory with this name already exists in this category'
      });
    }

    const subcategory = new Subcategory({
      name: name.trim(),
      category
    });

    await subcategory.save();

    const populated = await Subcategory.findById(subcategory._id).populate('category', 'name');

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subcategory
// @route   PUT /api/subcategories/:id
// @access  Private (Admin)
export const updateSubcategory = async (req, res, next) => {
  try {
    const { name, category, active } = req.body;
    const subcategory = await Subcategory.findById(req.params.id);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    if (name !== undefined) {
      // Check for duplicate name in same category
      const existing = await Subcategory.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        category: category || subcategory.category
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Subcategory with this name already exists in this category'
        });
      }
      subcategory.name = name.trim();
    }

    if (category !== undefined) {
      // Verify category exists
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
      subcategory.category = category;
    }

    if (active !== undefined) {
      subcategory.active = active;
    }

    await subcategory.save();

    const populated = await Subcategory.findById(subcategory._id).populate('category', 'name');

    res.json({
      success: true,
      message: 'Subcategory updated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subcategory
// @route   DELETE /api/subcategories/:id
// @access  Private (Admin)
export const deleteSubcategory = async (req, res, next) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    await subcategory.deleteOne();

    res.json({
      success: true,
      message: 'Subcategory deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};