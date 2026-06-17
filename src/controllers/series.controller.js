import Series from '../models/series.model.js';
import Category from '../models/category.model.js';

// @desc    Get all series
// @route   GET /api/series
// @access  Private
export const getSeries = async (req, res, next) => {
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

    const total = await Series.countDocuments(query);
    const series = await Series.find(query)
      .populate('category', 'name')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: series,
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

// @desc    Get series by ID
// @route   GET /api/series/:id
// @access  Private
export const getSeriesById = async (req, res, next) => {
  try {
    const series = await Series.findById(req.params.id).populate('category', 'name');

    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
      });
    }

    res.json({
      success: true,
      data: series
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create series
// @route   POST /api/series
// @access  Private (Admin)
export const createSeries = async (req, res, next) => {
  try {
    const { name, category, subSeries } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Series name is required'
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

    // Check for existing series in this category
    const existing = await Series.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      category
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Series with this name already exists in this category'
      });
    }

    const series = new Series({
      name: name.trim(),
      category,
      subSeries: subSeries || []
    });

    await series.save();

    const populated = await Series.findById(series._id).populate('category', 'name');

    res.status(201).json({
      success: true,
      message: 'Series created successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update series
// @route   PUT /api/series/:id
// @access  Private (Admin)
export const updateSeries = async (req, res, next) => {
  try {
    const { name, category, active } = req.body;
    const series = await Series.findById(req.params.id);

    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
      });
    }

    if (name !== undefined) {
      // Check for duplicate name in same category
      const existing = await Series.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        category: category || series.category
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Series with this name already exists in this category'
        });
      }
      series.name = name.trim();
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
      series.category = category;
    }

    if (active !== undefined) {
      series.active = active;
    }

    await series.save();

    const populated = await Series.findById(series._id).populate('category', 'name');

    res.json({
      success: true,
      message: 'Series updated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete series
// @route   DELETE /api/series/:id
// @access  Private (Admin)
export const deleteSeries = async (req, res, next) => {
  try {
    const series = await Series.findById(req.params.id);

    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
      });
    }

    await series.deleteOne();

    res.json({
      success: true,
      message: 'Series deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add sub-series to a series
// @route   POST /api/series/:id/subseries
// @access  Private (Admin)
export const addSubSeries = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Sub-series name is required'
      });
    }

    const series = await Series.findById(id);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
      });
    }

    // Auto-generate code based on sequence (S1, S2, S3...)
    const nextNumber = (series.subSeries?.length || 0) + 1;
    const code = `S${nextNumber}`;

    series.subSeries.push({
      name: name.trim(),
      code: code,
      active: true
    });

    await series.save();

    const populated = await Series.findById(series._id).populate('category', 'name');

    res.json({
      success: true,
      message: 'Sub-series added successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update sub-series
// @route   PUT /api/series/:id/subseries/:subId
// @access  Private (Admin)
export const updateSubSeries = async (req, res, next) => {
  try {
    const { id, subId } = req.params;
    const { name, code, active } = req.body;

    const series = await Series.findById(id);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
      });
    }

    const subSeriesItem = series.subSeries.id(subId);
    if (!subSeriesItem) {
      return res.status(404).json({
        success: false,
        message: 'Sub-series not found'
      });
    }

    if (name !== undefined) {
      subSeriesItem.name = name.trim();
    }
    if (code !== undefined) {
      // Check if new code already exists
      const existingCode = series.subSeries.find(
        ss => ss._id.toString() !== subId && ss.code.toUpperCase() === code.trim().toUpperCase()
      );
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Sub-series with this code already exists'
        });
      }
      subSeriesItem.code = code.trim().toUpperCase();
    }
    if (active !== undefined) {
      subSeriesItem.active = active;
    }

    await series.save();

    const populated = await Series.findById(series._id).populate('category', 'name');

    res.json({
      success: true,
      message: 'Sub-series updated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete sub-series
// @route   DELETE /api/series/:id/subseries/:subId
// @access  Private (Admin)
export const deleteSubSeries = async (req, res, next) => {
  try {
    const { id, subId } = req.params;

    const series = await Series.findById(id);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
      });
    }

    const subSeriesIndex = series.subSeries.findIndex(ss => ss._id.toString() === subId);
    if (subSeriesIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Sub-series not found'
      });
    }

    series.subSeries.splice(subSeriesIndex, 1);
    await series.save();

    const populated = await Series.findById(series._id).populate('category', 'name');

    res.json({
      success: true,
      message: 'Sub-series deleted successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};