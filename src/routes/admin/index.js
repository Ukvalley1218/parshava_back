import express from 'express';
import { adminAuth } from '../../middleware/admin.js';
import {
  adminLogin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword
} from '../../controllers/admin/auth.controller.js';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus
} from '../../controllers/admin/users.controller.js';

import {
  getDashboardStats,
  getRecentInquiries,
  getRecentOrders
} from '../../controllers/admin/dashboard.controller.js';
import Customer from '../../models/customer.model.js';
import Inquiry from '../../models/inquiry.model.js';
import Order from '../../models/order.model.js';
import Product from '../../models/product.model.js';
import Brand from '../../models/brand.model.js';

const router = express.Router();

// ============================================
// PUBLIC ADMIN ROUTES (No Auth Required)
// ============================================

// Admin login
router.post('/auth/login', adminLogin);

// ============================================
// PROTECTED ADMIN ROUTES (Auth Required)
// ============================================

// Apply admin auth middleware to all routes below
router.use(adminAuth);

// ============================================
// AUTH ROUTES
// ============================================

router.get('/auth/me', getAdminProfile);
router.put('/auth/profile', updateAdminProfile);
router.put('/auth/change-password', changeAdminPassword);

// ============================================
// USERS ROUTES
// ============================================

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);

// ============================================
// CUSTOMERS ROUTES
// ============================================

router.get('/customers', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { firmName: { $regex: search, $options: 'i' } },
        { softwareId: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { mobile2: { $regex: search, $options: 'i' } },
        { mobile3: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
        { panNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),

      Customer.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

router.get('/customers/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (error) { next(error); }
});

router.post('/customers', async (req, res, next) => {
  try {

    const customerData = {
      softwareId: req.body.softwareId,

      // Personal Details
      firmName: req.body.firmName,
      firmPhoto: req.body.firmPhoto,
      name: req.body.name,
      customerPhoto: req.body.customerPhoto,
      designation: req.body.designation,

      // Contact Numbers
      mobile: req.body.mobile,
      isWhatsApp: req.body.isWhatsApp ?? true,
      mobile2: req.body.mobile2,
      mobile2Whatsapp: req.body.mobile2Whatsapp || false,
      mobile3: req.body.mobile3,
      mobile3Whatsapp: req.body.mobile3Whatsapp || false,

      email: req.body.email,

      // Address
      address: req.body.address,
      googleLocation: req.body.googleLocation,
      landmark: req.body.landmark,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      country: req.body.country || 'India',

      // Business Documents
      gstin: req.body.gstin,
      panNumber: req.body.panNumber,
      aadharNumber: req.body.aadharNumber,
      shopActNumber: req.body.shopActNumber,
      msmeNumber: req.body.msmeNumber,
      documents: req.body.documents || [],

      // Management
      priceListCategory: req.body.priceListCategory || 'T1',
      accountManager: req.body.accountManager,
      productManager: req.body.productManager,

      // Additional
      customerType: req.body.customerType || 'customer',
      customerStatus: req.body.customerStatus || 'active',
      leadSource: req.body.leadSource,
      notes: req.body.notes
    };

    const customer = await Customer.create(customerData);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });

  } catch (error) {
    next(error);
  }
});

router.put('/customers/:id', async (req, res, next) => {
  try {

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });

  } catch (error) {
    next(error);
  }
});

router.delete('/customers/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) { next(error); }
});

// ============================================
// INQUIRIES ROUTES
// ============================================

router.get('/inquiries', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { inquiryId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [inquiries, total] = await Promise.all([
      Inquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Inquiry.countDocuments(query)
    ]);

    res.json({ success: true, data: inquiries, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalItems: total } });
  } catch (error) { next(error); }
});

router.get('/inquiries/:id', async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id).populate('customerId').populate('createdBy', 'name email');
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    res.json({ success: true, data: inquiry });
  } catch (error) { next(error); }
});

router.patch('/inquiries/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    res.json({ success: true, message: 'Status updated successfully', data: inquiry });
  } catch (error) { next(error); }
});

router.delete('/inquiries/:id', async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) { next(error); }
});

router.post('/inquiries/:id/convert', async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });

    // Create order from inquiry
    const order = await Order.create({
      customerId: inquiry.customerId,
      customerDetails: inquiry.customerDetails,
      items: inquiry.items,
      subtotal: inquiry.subtotal,
      discountTotal: inquiry.discountTotal,
      gstTotal: inquiry.gstTotal,
      grandTotal: inquiry.grandTotal,
      status: 'pending',
      inquiryId: inquiry._id,
      createdBy: req.user._id
    });

    // Update inquiry status
    inquiry.status = 'converted';
    await inquiry.save();

    res.json({ success: true, message: 'Inquiry converted to order successfully', data: order });
  } catch (error) { next(error); }
});

// ============================================
// ORDERS ROUTES
// ============================================

router.get('/orders', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.json({ success: true, data: orders, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalItems: total } });
  } catch (error) { next(error); }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('customerId').populate('createdBy', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) { next(error); }
});

router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Status updated successfully', data: order });
  } catch (error) { next(error); }
});

router.delete('/orders/:id', async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) { next(error); }
});

// ============================================
// PRODUCTS ROUTES
// ============================================

router.get('/products', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, brand, category, subcategory, search } = req.query;
    const query = {};

    if (brand) query.brand = brand;
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { partNumber: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);

    res.json({ success: true, data: products, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalItems: total } });
  } catch (error) { next(error); }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
});

router.post('/products', async (req, res, next) => {
  try {
    const productData = {
      name: req.body.name,
      imageUrl: req.body.imageUrl,
      partNumber: req.body.partNumber,
      description: req.body.description,
      brand: req.body.brand,
      brandId: req.body.brandId,
      category: req.body.category,
      categoryId: req.body.categoryId,
      subcategory: req.body.subcategory,
      subcategoryId: req.body.subcategoryId,
      unit: req.body.unit,
      hsn: req.body.hsn,
      gstRate: req.body.gstRate,
      mrp: req.body.mrp,
      mop: req.body.mop,
      purchasePrice: req.body.purchasePrice,
      cnlc: req.body.cnlc,
      mnlc: req.body.mnlc,
      opPrice: req.body.opPrice,
      t1: req.body.t1,
      t2: req.body.t2,
      t3: req.body.t3,
      t4: req.body.t4,
      bottomPrice: req.body.bottomPrice,
      density: req.body.density || 'Regular',
      stock: req.body.stock || 0,
      active: req.body.active !== undefined ? req.body.active : true
    };

    const product = await Product.create(productData);
    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) { next(error); }
});

router.put('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) { next(error); }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) { next(error); }
});

// ============================================
// DASHBOARD ROUTES
// ============================================

router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/recent-inquiries', getRecentInquiries);
router.get('/dashboard/recent-orders', getRecentOrders);

// ============================================
// REPORTS ROUTES
// ============================================

router.get('/reports/sales', async (req, res, next) => {
  try {
    // Return placeholder data for now
    res.json({ success: true, data: [] });
  } catch (error) { next(error); }
});

router.get('/reports/revenue', async (req, res, next) => {
  try {
    // Return placeholder data for now
    res.json({ success: true, data: [] });
  } catch (error) { next(error); }
});

// ============================================
// BRANDS ROUTES
// ============================================

// Get all brands with categories and subcategories
router.get('/brands', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = { active: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'categories.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [brands, total] = await Promise.all([
      Brand.find(query).sort({ name: 1 }).skip(skip).limit(parseInt(limit)),
      Brand.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: brands,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) { next(error); }
});

// Get distinct brands from products (for import)
router.get('/brands/distinct', async (req, res, next) => {
  try {
    const brands = await Product.distinct('brand', { brand: { $ne: null, $ne: '' } });
    const categories = await Product.distinct('category', { category: { $ne: null, $ne: '' } });

    res.json({
      success: true,
      data: {
        brands: brands.sort(),
        categories: categories.sort()
      }
    });
  } catch (error) { next(error); }
});

// Get single brand
router.get('/brands/:id', async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.json({ success: true, data: brand });
  } catch (error) { next(error); }
});

// Create brand
router.post('/brands', async (req, res, next) => {
  try {
    const { name, categories } = req.body;

    const existingBrand = await Brand.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingBrand) {
      return res.status(400).json({ success: false, message: 'Brand already exists' });
    }

    const brand = await Brand.create({
      name,
      categories: categories || [],
      active: true
    });

    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: brand
    });
  } catch (error) { next(error); }
});

// Update brand
router.put('/brands/:id', async (req, res, next) => {
  try {
    const { name, active } = req.body;

    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { name, active },
      { new: true, runValidators: true }
    );

    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    res.json({ success: true, message: 'Brand updated successfully', data: brand });
  } catch (error) { next(error); }
});

// Delete brand
router.delete('/brands/:id', async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.json({ success: true, message: 'Brand deleted successfully' });
  } catch (error) { next(error); }
});

// Add category to brand
router.post('/brands/:id/categories', async (req, res, next) => {
  try {
    const { name } = req.body;
    const brand = await Brand.findById(req.params.id);

    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    const existingCategory = brand.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existingCategory) {
      return res.status(400).json({ success: false, message: 'Category already exists in this brand' });
    }

    brand.categories.push({ name, subcategories: [], active: true });
    await brand.save();

    res.json({ success: true, message: 'Category added successfully', data: brand });
  } catch (error) { next(error); }
});

// Update category
router.put('/brands/:brandId/categories/:categoryId', async (req, res, next) => {
  try {
    const { name, active } = req.body;
    const brand = await Brand.findById(req.params.brandId);

    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    const category = brand.categories.id(req.params.categoryId);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    if (name) category.name = name;
    if (active !== undefined) category.active = active;
    await brand.save();

    res.json({ success: true, message: 'Category updated successfully', data: brand });
  } catch (error) { next(error); }
});

// Delete category
router.delete('/brands/:brandId/categories/:categoryId', async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.brandId);

    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    brand.categories.pull(req.params.categoryId);
    await brand.save();

    res.json({ success: true, message: 'Category deleted successfully', data: brand });
  } catch (error) { next(error); }
});

// Add subcategory to category
router.post('/brands/:brandId/categories/:categoryId/subcategories', async (req, res, next) => {
  try {
    const { name } = req.body;
    const brand = await Brand.findById(req.params.brandId);

    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    const category = brand.categories.id(req.params.categoryId);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    const existingSub = category.subcategories.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existingSub) {
      return res.status(400).json({ success: false, message: 'Subcategory already exists in this category' });
    }

    category.subcategories.push({ name, active: true });
    await brand.save();

    res.json({ success: true, message: 'Subcategory added successfully', data: brand });
  } catch (error) { next(error); }
});

// Update subcategory
router.put('/brands/:brandId/categories/:categoryId/subcategories/:subcategoryId', async (req, res, next) => {
  try {
    const { name, active } = req.body;
    const brand = await Brand.findById(req.params.brandId);

    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    const category = brand.categories.id(req.params.categoryId);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    const subcategory = category.subcategories.id(req.params.subcategoryId);
    if (!subcategory) return res.status(404).json({ success: false, message: 'Subcategory not found' });

    if (name) subcategory.name = name;
    if (active !== undefined) subcategory.active = active;
    await brand.save();

    res.json({ success: true, message: 'Subcategory updated successfully', data: brand });
  } catch (error) { next(error); }
});

// Delete subcategory
router.delete('/brands/:brandId/categories/:categoryId/subcategories/:subcategoryId', async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.brandId);

    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    const category = brand.categories.id(req.params.categoryId);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    category.subcategories.pull(req.params.subcategoryId);
    await brand.save();

    res.json({ success: true, message: 'Subcategory deleted successfully', data: brand });
  } catch (error) { next(error); }
});

// Import brands from products
router.post('/brands/import-from-products', async (req, res, next) => {
  try {
    const { brands: selectedBrands } = req.body;

    // Get distinct brand-category pairs from products
    const pipeline = [
      { $match: { brand: { $ne: null, $ne: '' } } },
      { $group: { _id: { brand: '$brand', category: '$category' } } }
    ];

    const results = await Product.aggregate(pipeline);

    // Group by brand
    const brandMap = new Map();

    results.forEach(r => {
      const brandName = r._id.brand;
      const categoryName = r._id.category;

      if (!brandMap.has(brandName)) {
        brandMap.set(brandName, new Set());
      }
      if (categoryName) {
        brandMap.get(brandName).add(categoryName);
      }
    });

    // If specific brands selected, filter them
    const brandsToProcess = selectedBrands
      ? Array.from(brandMap.keys()).filter(b => selectedBrands.includes(b))
      : Array.from(brandMap.keys());

    let imported = 0;
    let skipped = 0;

    for (const brandName of brandsToProcess) {
      const existingBrand = await Brand.findOne({ name: { $regex: new RegExp(`^${brandName}$`, 'i') } });

      if (existingBrand) {
        // Add missing categories to existing brand
        const categories = brandMap.get(brandName);
        let updated = false;

        for (const catName of categories) {
          const existingCat = existingBrand.categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
          if (!existingCat) {
            existingBrand.categories.push({ name: catName, subcategories: [], active: true });
            updated = true;
          }
        }

        if (updated) {
          await existingBrand.save();
        }
        skipped++;
      } else {
        // Create new brand with categories
        const categories = Array.from(brandMap.get(brandName)).map(catName => ({
          name: catName,
          subcategories: [],
          active: true
        }));

        await Brand.create({
          name: brandName,
          categories,
          active: true,
          isImported: true
        });
        imported++;
      }
    }

    res.json({
      success: true,
      message: `Imported ${imported} new brands, updated ${skipped} existing brands`,
      data: { imported, skipped }
    });
  } catch (error) { next(error); }
});

export default router;