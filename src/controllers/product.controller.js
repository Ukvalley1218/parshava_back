import productService from '../services/product.service.js';

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
    const { page, limit, search, brand, brands, category, categories } = req.query;

    const result = await productService.getProducts({
      page: page || 1,
      limit: limit || 10,
      search: search || '',
      brand: brand || '',
      brands: brands || '',
      category: category || '',
      categories: categories || ''
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

// @desc    Get unique brands list, optionally filtered by category
// @route   GET /api/products/brands
// @access  Private
export const getBrands = async (req, res, next) => {
  try {
    const { category } = req.query;
    const brands = await productService.getBrands(category || '');

    res.json({
      success: true,
      data: brands
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unique categories list
// @route   GET /api/products/categories
// @access  Private
export const getCategories = async (req, res, next) => {
  try {
    const categories = await productService.getCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};