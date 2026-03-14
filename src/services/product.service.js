import axios from 'axios';
import Product from '../models/product.model.js';

class ProductService {
  /**
   * Sync products from AccountGST product master API
   * @returns {Object} Sync result with count of products synced
   */
  async syncProductsFromAccountGST() {
    // Call AccountGST product master API
    const response = await axios.post(
      'https://ultimate.accountgst.com/admin/api/productmasterapi.php',
      {
        connectingkey: process.env.ACCOUNTGST_KEY,
        companycode: process.env.ACCOUNTGST_COMPANY,
        newlycreated: '0'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.success || !response.data.data?.items) {
      throw new Error('Failed to fetch products from AccountGST');
    }

    const items = response.data.data.items;
    const syncTime = new Date();
    let syncedCount = 0;
    let failedCount = 0;

    // Loop through products and upsert into MongoDB
    for (const item of items) {
      try {
        await Product.findOneAndUpdate(
          { accountgstProductId: item.product_id },
          {
              name: item.productname?.replace(/\\'/g, "'") || "",

          partNumber: item.partnumber || "",

          brand: item.brandname || "",

          category: item.categoryname || "",

          productType: item.producttype || "",

          ledgerAccount: item.ledgeraccount || "",

          mrp: parseFloat(item.mrp || 0),

          mop: parseFloat(item.mop || 0),

          gstRate: parseFloat(item.gst || 0),

          hsn: item.hsnsac || "",

          unit: item.unit || "",

          stock: parseFloat(item.stock || 0),

          accountgstProductId: item.productconnectid,

          syncStatus: "synced",

          lastSyncedAt: syncTime
          },
          {
            upsert: true,
            new: true,
            runValidators: true
          }
        );
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync product ${item.product_id}:`, error.message);
        failedCount++;
      }
    }

    return {
      totalProducts: items.length,
      syncedCount,
      failedCount,
      syncedAt: syncTime
    };
  }

  /**
   * Get all products with pagination, search, and filters
   * @param {Object} options - Query options
   * @returns {Object} Products with pagination info
   */
  async getProducts({ page = 1, limit = 10, search = '', brand = '', brands = '', category = '', categories = '' }) {
    const query = {};

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Filter by single brand (backward compatibility)
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    // Filter by multiple brands (comma-separated)
    if (brands) {
      const brandArray = brands.split(',').map(b => b.trim()).filter(b => b);
      if (brandArray.length > 0) {
        query.brand = { $in: brandArray.map(b => new RegExp(`^${b}$`, 'i')) };
      }
    }

    // Filter by single category (backward compatibility)
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    // Filter by multiple categories (comma-separated)
    if (categories) {
      const categoryArray = categories.split(',').map(c => c.trim()).filter(c => c);
      if (categoryArray.length > 0) {
        query.category = { $in: categoryArray.map(c => new RegExp(`^${c}$`, 'i')) };
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);

    return {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    };
  }

  /**
   * Get product by ID with detailed information
   * @param {String} productId - Product ID
   * @returns {Object} Product details
   */
  async getProductById(productId) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    // Return product with specifications structure
    return {
      name: product.name,
      price: product.price,
      gstRate: product.gstRate,
      description: product.description,
      stock: product.stock,
      specifications: {
        partNumber: product.partNumber,
        brand: product.brand,
        category: product.category,
        mop: product.mop,
        nlc: product.nlc,
        hsn: product.hsn,
        unit: product.unit
      },
      accountgstProductId: product.accountgstProductId,
      syncStatus: product.syncStatus,
      lastSyncedAt: product.lastSyncedAt
    };
  }

  /**
   * Get unique brands list, optionally filtered by category
   * @param {String} category - Optional category to filter brands
   * @returns {Array} List of unique brands
   */
  async getBrands(category = '') {
    const query = { brand: { $ne: null, $ne: '' } };

    // Filter by category if provided
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    const brands = await Product.distinct('brand', query);
    return brands.filter(b => b).sort();
  }

  /**
   * Get unique categories list
   * @returns {Array} List of unique categories
   */
  async getCategories() {
    const categories = await Product.distinct('category', { category: { $ne: null, $ne: '' } });
    return categories.filter(c => c).sort();
  }

  /**
   * Create a new product manually
   * @param {Object} data - Product data
   * @returns {Object} Created product
   */
  async createProduct(data) {
    const product = await Product.create({
      ...data,
      syncStatus: 'pending'
    });
    return product;
  }

  /**
   * Update product by ID
   * @param {String} productId - Product ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated product
   */
  async updateProduct(productId, updateData) {
    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  /**
   * Delete product by ID
   * @param {String} productId - Product ID
   * @returns {Boolean} Success status
   */
  async deleteProduct(productId) {
    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    return true;
  }
}

export default new ProductService();