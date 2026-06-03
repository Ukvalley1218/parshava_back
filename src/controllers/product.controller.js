import productService from '../services/product.service.js';
import Brand from '../models/brand.model.js';

// @desc    Sync products from AccountGST
// @route   POST /api/products/sync
// @access  Private
export const syncProducts = async (req, res, next) => {
  try {
    const result = await productService.syncProductsFromAccountGST();

    res.json({
      success: true,
      message: 'Products synced successfully from AccountGST',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products with pagination and filters
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res, next) => {
  try {
    const { page, limit, search, brand, brands, category, categories, productType, subcategory } = req.query;

    // Get user's assigned brands (for role-based access control)
    const user = req.user;
    let userAssignedBrands = null;

    // If user is not admin/superadmin and has assigned brands, filter by those brands
    if (user && user.role !== 'admin' && user.role !== 'superadmin') {
      if (user.assignedBrands && user.assignedBrands.length > 0) {
        userAssignedBrands = user.assignedBrands;
      }
    }

    const result = await productService.getProducts({
      page: page || 1,
      limit: limit || 10,
      search: search || '',
      brand: brand || '',
      brands: brands || '',
      category: category || '',
      categories: categories || '',
      productType: productType || '',
      subcategory: subcategory || '',
      userAssignedBrands
    });

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    next(error);
  }
};

// @desc    Get all brands from Brand collection
// @route   GET /api/products/brands/all
// @access  Private
export const getAllBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({ active: true })
      .select('name categories')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: brands.map(b => ({
        _id: b._id,
        name: b.name,
        categoryCount: b.categories?.length || 0
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unique brands list, optionally filtered by category
// @route   GET /api/products/brands
// @access  Private
export const getBrands = async (req, res, next) => {
  try {
    const { category } = req.query;

    // Get user's assigned brands (for role-based access control)
    const user = req.user;
    let userAssignedBrands = null;

    // If user is not admin/superadmin and has assigned brands, filter by those brands
    if (user && user.role !== 'admin' && user.role !== 'superadmin') {
      if (user.assignedBrands && user.assignedBrands.length > 0) {
        userAssignedBrands = user.assignedBrands;
      }
    }

    if (category) {
      // Get brands that have this category
      let query = {
        active: true,
        'categories.name': { $regex: new RegExp(`^${category}$`, 'i') }
      };

      // Filter by user's assigned brands if applicable
      if (userAssignedBrands) {
        query.name = { $in: userAssignedBrands };
      }

      const brands = await Brand.find(query).select('name').sort({ name: 1 });

      res.json({
        success: true,
        data: brands.map(b => b.name)
      });
    } else {
      // Get all active brands
      let query = { active: true };

      // Filter by user's assigned brands if applicable
      if (userAssignedBrands) {
        query.name = { $in: userAssignedBrands };
      }

      const brands = await Brand.find(query)
        .select('name')
        .sort({ name: 1 });

      res.json({
        success: true,
        data: brands.map(b => b.name)
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get brands available to current user
// @route   GET /api/products/brands/user
// @access  Private
export const getUserBrands = async (req, res, next) => {
  try {
    const user = req.user;

    // Admin and superadmin see all brands
    if (user.role === 'admin' || user.role === 'superadmin') {
      const brands = await Brand.find({ active: true })
        .select('name')
        .sort({ name: 1 });

      return res.json({
        success: true,
        data: brands.map(b => b.name)
      });
    }

    // Product managers and account managers see only their assigned brands
    if (user.assignedBrands && user.assignedBrands.length > 0) {
      return res.json({
        success: true,
        data: user.assignedBrands
      });
    }

    // Regular users (sales users) see all brands
    const brands = await Brand.find({ active: true })
      .select('name')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: brands.map(b => b.name)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unique categories list, optionally filtered by brand
// @route   GET /api/products/categories
// @access  Private
export const getCategories = async (req, res, next) => {
  try {
    const { brand } = req.query;

    if (brand) {
      // Get categories for this brand from Brand collection
      const brandDoc = await Brand.findOne({
        active: true,
        name: { $regex: new RegExp(`^${brand}$`, 'i') }
      });

      if (brandDoc && brandDoc.categories) {
        const categories = brandDoc.categories
          .filter(c => c.active !== false)
          .map(c => c.name);

        res.json({
          success: true,
          data: categories
        });
      } else {
        // Fallback to products collection
        const categories = await productService.getCategories(brand);
        res.json({ success: true, data: categories });
      }
    } else {
      // Get all categories from Brand collection
      const brands = await Brand.find({ active: true }).select('categories');
      const allCategories = new Set();

      brands.forEach(b => {
        if (b.categories) {
          b.categories.forEach(c => {
            if (c.active !== false) {
              allCategories.add(c.name);
            }
          });
        }
      });

      res.json({
        success: true,
        data: Array.from(allCategories).sort()
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get unique productTypes (subcategories), filtered by brand and category
// @route   GET /api/products/subcategories
// @access  Private
export const getProductTypes = async (req, res, next) => {
  try {
    const { brand, category } = req.query;

    if (brand && category) {
      // Get subcategories for this brand+category from Brand collection
      const brandDoc = await Brand.findOne({
        active: true,
        name: { $regex: new RegExp(`^${brand}$`, 'i') }
      });

      if (brandDoc && brandDoc.categories) {
        const categoryDoc = brandDoc.categories.find(
          c => c.name.toLowerCase() === category.toLowerCase() && c.active !== false
        );

        if (categoryDoc && categoryDoc.subcategories) {
          const subcategories = categoryDoc.subcategories
            .filter(s => s.active !== false)
            .map(s => s.name);

          res.json({
            success: true,
            data: subcategories
          });
          return;
        }
      }
    }

    // Fallback to products collection
    const productTypes = await productService.getProductTypes(brand || '', category || '');
    res.json({
      success: true,
      data: productTypes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get categories for a specific brand from Brand collection
// @route   GET /api/products/brand/:brandId/categories
// @access  Private
export const getBrandCategories = async (req, res, next) => {
  try {
    const { brandId } = req.params;

    const brand = await Brand.findById(brandId);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    const categories = (brand.categories || [])
      .filter(c => c.active !== false)
      .map(c => ({
        _id: c._id,
        name: c.name,
        subcategoryCount: c.subcategories?.length || 0
      }));

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subcategories for a specific brand and category from Brand collection
// @route   GET /api/products/brand/:brandId/category/:categoryId/subcategories
// @access  Private
export const getCategorySubcategories = async (req, res, next) => {
  try {
    const { brandId, categoryId } = req.params;

    const brand = await Brand.findById(brandId);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    const category = brand.categories?.id(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const subcategories = (category.subcategories || [])
      .filter(s => s.active !== false)
      .map(s => ({
        _id: s._id,
        name: s.name
      }));

    res.json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    next(error);
  }
};