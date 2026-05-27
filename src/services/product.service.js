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
   * Supports filtering by: brand, category, productType (subcategory), subcategory
   * Optimized for performance with text search and lean queries
   * @param {Object} options - Query options
   * @returns {Object} Products with pagination info
   */
  async getProducts({ page = 1, limit = 10, search = '', brand = '', brands = '', category = '', categories = '', productType = '', subcategory = '' }) {
    const query = {};

    // Use text search for better performance (uses text index)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      // Use text search for fast full-text matching
      query.$text = { $search: searchTerm };
    }

    // Filter by single brand
    if (brand) {
      query.brand = brand;
    }

    // Filter by multiple brands (comma-separated)
    if (brands) {
      const brandArray = brands.split(',').map(b => b.trim()).filter(b => b);
      if (brandArray.length > 0) {
        query.brand = { $in: brandArray };
      }
    }

    // Filter by single category
    if (category) {
      query.category = category;
    }

    // Filter by multiple categories (comma-separated)
    if (categories) {
      const categoryArray = categories.split(',').map(c => c.trim()).filter(c => c);
      if (categoryArray.length > 0) {
        query.category = { $in: categoryArray };
      }
    }

    // Filter by productType (legacy subcategory field)
    if (productType) {
      query.productType = productType;
    }

    // Filter by subcategory (new field from Brand collection)
    if (subcategory) {
      query.subcategory = subcategory;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Use lean() for faster queries (~30% performance improvement)
    const [products, total] = await Promise.all([
      Product.find(query)
        .select('name partNumber brand category subcategory productType imageUrl mrp mop purchasePrice cnlc mnlc opPrice t1 t2 t3 t4 bottomPrice gstRate hsn unit stock density description accountgstProductId syncStatus createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
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
    const product = await Product.findById(productId).lean();

    if (!product) {
      throw new Error('Product not found');
    }

    // Return product with all fields
    return product;
  }

  /**
   * Get all unique brands list
   * @returns {Array} List of unique brands
   */
  async getAllBrands() {
    const brands = await Product.distinct('brand', { brand: { $ne: null, $ne: '' } });
    return brands.filter(b => b).sort();
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
   * Get unique categories list, optionally filtered by brand
   * @param {String} brand - Optional brand to filter categories
   * @returns {Array} List of unique categories
   */
  async getCategories(brand = '') {
    const query = { category: { $ne: null, $ne: '' } };

    // Filter by brand if provided
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    const categories = await Product.distinct('category', query);
    return categories.filter(c => c).sort();
  }

  /**
   * Get unique productTypes (subcategories), filtered by brand and/or category
   * @param {String} brand - Brand to filter by
   * @param {String} category - Category to filter by
   * @returns {Array} List of unique productTypes
   */
  async getProductTypes(brand = '', category = '') {
    const query = { productType: { $ne: null, $ne: '' } };

    // Filter by brand if provided
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    // Filter by category if provided
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    const productTypes = await Product.distinct('productType', query);
    return productTypes.filter(pt => pt).sort();
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