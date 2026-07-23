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
import User from '../../models/User.js';
import Order from '../../models/order.model.js';
import Product from '../../models/product.model.js';
import Brand from '../../models/brand.model.js';
import Contact from '../../models/contact.model.js';
import orderService from '../../services/order.service.js';
import customerService from '../../services/customer.service.js';
import productService from '../../services/product.service.js';

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
        .populate('businessCategory')
        .populate('brandCategory')
        .populate('accountManager', 'name email phone')
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

// Bulk update customers (for applying changes to specific accounts on current page)
router.post('/customers/bulk-update', async (req, res, next) => {
  try {
    const { customerIds, updates } = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided'
      });
    }

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No customers selected for update'
      });
    }

    // Only allow specific fields to be bulk updated
    const allowedFields = ['businessCategory', 'brandCategory', 'priceListCategory', 'accountType', 'accountManager'];
    const cleanUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        cleanUpdates[key] = value;
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const query = { _id: { $in: customerIds } };
    const result = await Customer.updateMany(query, cleanUpdates);

    res.json({
      success: true,
      message: `${result.modifiedCount} account(s) updated successfully`,
      matched: result.matchedCount,
      modified: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
});

router.get('/customers/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('businessCategory')
      .populate('brandCategory')
      .populate('accountManager', 'name email phone');
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (error) { next(error); }
});

router.post('/customers', async (req, res, next) => {
  try {
    // Check for duplicate mobile numbers
    const { mobile, mobile2, mobile3, email } = req.body;
    const mobileNumbers = [mobile, mobile2, mobile3].filter(n => n && n.trim() !== '');
    const emailValue = email && email.trim() !== '' ? email.trim().toLowerCase() : null;

    if (mobileNumbers.length > 0) {
      const existingMobile = await Customer.findOne({
        $or: mobileNumbers.map(num => ({ mobile: num })),
      });
      if (existingMobile) {
        return res.status(400).json({
          success: false,
          message: `A customer with mobile number ${existingMobile.mobile} already exists`
        });
      }

      // Also check mobile2 and mobile3 against all existing mobile fields
      const existingOtherMobile = await Customer.findOne({
        $or: mobileNumbers.flatMap(num => [
          { mobile: num },
          { mobile2: num },
          { mobile3: num }
        ])
      });
      if (existingOtherMobile) {
        return res.status(400).json({
          success: false,
          message: `A customer with this mobile number already exists`
        });
      }
    }

    if (emailValue) {
      const existingEmail = await Customer.findOne({ email: emailValue });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: `A customer with this email already exists`
        });
      }
    }

    // Use customer service to create customer with AccountGST sync
    const customer = await customerService.createCustomer(req.body, req.user._id);

    res.status(201).json({
      success: true,
      message: customer.syncStatus === 'synced'
        ? 'Customer created and synced to AccountGST successfully'
        : customer.syncStatus === 'failed'
          ? 'Customer created but AccountGST sync failed'
          : 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
});

router.put('/customers/:id', async (req, res, next) => {
  try {
    // Check for duplicate mobile numbers (excluding current customer)
    const { mobile, mobile2, mobile3, email } = req.body;
    const mobileNumbers = [mobile, mobile2, mobile3].filter(n => n && n.trim() !== '');
    const emailValue = email && email.trim() !== '' ? email.trim().toLowerCase() : null;
    const customerId = req.params.id;

    if (mobileNumbers.length > 0) {
      const existingOtherMobile = await Customer.findOne({
        _id: { $ne: customerId },
        $or: mobileNumbers.flatMap(num => [
          { mobile: num },
          { mobile2: num },
          { mobile3: num }
        ])
      });
      if (existingOtherMobile) {
        return res.status(400).json({
          success: false,
          message: `A customer with this mobile number already exists`
        });
      }
    }

    if (emailValue) {
      const existingEmail = await Customer.findOne({ _id: { $ne: customerId }, email: emailValue });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: `A customer with this email already exists`
        });
      }
    }

    // Clean up data - convert empty strings to null for ObjectId fields
    const cleanedData = { ...req.body };

    // Single ObjectId fields
    const singleObjectIdFields = ['productManager'];
    singleObjectIdFields.forEach(field => {
      if (cleanedData[field] === '' || cleanedData[field] === undefined) {
        cleanedData[field] = null;
      }
    });

    // Array ObjectId fields
    const arrayObjectIdFields = ['businessCategory', 'brandCategory', 'accountManager'];
    arrayObjectIdFields.forEach(field => {
      if (!cleanedData[field] || !Array.isArray(cleanedData[field])) {
        cleanedData[field] = [];
      }
      // Filter out empty strings
      cleanedData[field] = cleanedData[field].filter(id => id && id !== '');
    });

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      cleanedData,
      {
        new: true,
        runValidators: true
      }
    ).populate('accountManager', 'name email phone');

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

// Retry AccountGST sync for failed customers
router.post('/customers/:id/retry-sync', async (req, res, next) => {
  try {
    const customer = await customerService.retrySync(req.params.id);
    res.json({
      success: true,
      message: customer.syncStatus === 'synced'
        ? 'Customer synced to AccountGST successfully'
        : 'AccountGST sync failed',
      data: customer
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// INQUIRIES ROUTES
// ============================================

router.get('/inquiries', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};

    // Filter out cancelled (soft-deleted) inquiries by default
    // Only show cancelled if explicitly requested
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'cancelled' };
    }

    if (search) {
      query.$or = [
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { inquiryId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [inquiries, total] = await Promise.all([
      Inquiry.find(query).populate('createdBy', 'name email').populate('assignedTo', 'name email role').populate('assignedBy', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Inquiry.countDocuments(query)
    ]);

    res.json({ success: true, data: inquiries, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalItems: total } });
  } catch (error) { next(error); }
});

router.get('/inquiries/:id', async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id).populate('customerId').populate('createdBy', 'name email').populate('assignedTo', 'name email role').populate('assignedBy', 'name email role');
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    // Don't return cancelled inquiries unless explicitly requested
    if (inquiry.status === 'cancelled') {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
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
    // Use soft delete - set status to 'cancelled' instead of hard delete
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) { next(error); }
});

router.post('/inquiries/:id/convert', async (req, res, next) => {
  try {
    // Use order service to create order with AccountGST sync
    const order = await orderService.createOrderFromInquiry(req.params.id, req.user._id);

    res.json({
      success: true,
      message: 'Inquiry converted to order successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Assign inquiry to a user (admin)
// @route   POST /admin/inquiries/:id/assign
// @access  Admin
router.post('/inquiries/:id/assign', async (req, res, next) => {
  try {
    const { assignedToUserId } = req.body;

    if (!assignedToUserId) {
      return res.status(400).json({ success: false, message: 'assignedToUserId is required' });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry || inquiry.status === 'cancelled') {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    // Verify assigned user exists and is active
    const assignedUser = await User.findById(assignedToUserId);
    if (!assignedUser || !assignedUser.isActive) {
      return res.status(400).json({ success: false, message: 'Assigned user not found or inactive' });
    }

    inquiry.assignedTo = assignedToUserId;
    inquiry.assignedBy = req.user._id;
    inquiry.assignedAt = new Date();
    await inquiry.save();

    const updatedInquiry = await Inquiry.findById(inquiry._id)
      .populate('customerId')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role');

    res.json({ success: true, message: 'Inquiry assigned successfully', data: updatedInquiry });
  } catch (error) { next(error); }
});

// @desc    Get users for assignment dropdown (admin)
// @route   GET /admin/inquiries/users
// @access  Admin
router.get('/inquiries/users', async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true })
      .select('name email role')
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, data: users });
  } catch (error) { next(error); }
});

// ============================================
// ORDERS ROUTES
// ============================================

router.get('/orders', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};

    // Filter out cancelled (soft-deleted) orders by default
    // Only show cancelled if explicitly requested
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'cancelled' };
    }

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
    // Don't return cancelled orders unless explicitly requested
    if (order.status === 'cancelled') {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
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
    // Use soft delete - set status to 'cancelled' instead of hard delete
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) { next(error); }
});

// Retry AccountGST sync for failed orders
router.post('/orders/:id/retry-sync', async (req, res, next) => {
  try {
    const order = await orderService.retryAccountGSTSync(req.params.id);
    res.json({
      success: true,
      message: 'Order synced to AccountGST successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
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
    // Convert empty ObjectId strings to undefined to prevent CastError
    const objectIdFields = ['brandId', 'categoryId', 'subcategoryId', 'seriesId', 'subSeriesId'];
    const processedBody = { ...req.body };

    objectIdFields.forEach(field => {
      if (processedBody[field] === '' || processedBody[field] === null) {
        processedBody[field] = undefined;
      }
    });

    const productData = {
      name: processedBody.name,
      imageUrl: processedBody.imageUrl,
      partNumber: processedBody.partNumber,
      description: processedBody.description,
      shortDescription: processedBody.shortDescription,
      brand: processedBody.brand,
      brandId: processedBody.brandId,
      category: processedBody.category,
      categoryId: processedBody.categoryId,
      subcategory: processedBody.subcategory,
      subcategoryId: processedBody.subcategoryId,
      unit: processedBody.unit,
      hsn: processedBody.hsn,
      gstRate: processedBody.gstRate,
      mrp: processedBody.mrp,
      mop: processedBody.mop,
      purchasePrice: processedBody.purchasePrice,
      marketPrice: processedBody.marketPrice,
      marketPriceSI: processedBody.marketPriceSI,
      marketPriceReseller: processedBody.marketPriceReseller,
      // Pricing calculator fields
      basePriceType: processedBody.basePriceType,
      dis1: processedBody.dis1,
      dis1Type: processedBody.dis1Type,
      dis2: processedBody.dis2,
      dis2Type: processedBody.dis2Type,
      dis3: processedBody.dis3,
      dis3Type: processedBody.dis3Type,
      dis4: processedBody.dis4,
      dis4Type: processedBody.dis4Type,
      dis5: processedBody.dis5,
      dis5Type: processedBody.dis5Type,
      nlc: processedBody.nlc,
      profit: processedBody.profit,
      profitType: processedBody.profitType,
      op1: processedBody.op1,
      op1Type: processedBody.op1Type,
      op2: processedBody.op2,
      op2Type: processedBody.op2Type,
      op3: processedBody.op3,
      op3Type: processedBody.op3Type,
      op4: processedBody.op4,
      op4Type: processedBody.op4Type,
      // Legacy fields
      cnlc: processedBody.cnlc,
      mnlc: processedBody.mnlc,
      opPrice: processedBody.opPrice,
      t1: processedBody.t1,
      t2: processedBody.t2,
      t3: processedBody.t3,
      t4: processedBody.t4,
      bottomPrice: processedBody.bottomPrice,
      density: processedBody.density || 'Regular',
      boxSize: processedBody.boxSize,
      procurement: processedBody.procurement,
      stock: processedBody.stock || 0,
      active: processedBody.active !== undefined ? processedBody.active : true
    };

    // Use product service for creation
    const product = await productService.createProduct(productData);
    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) { next(error); }
});

router.put('/products/:id', async (req, res, next) => {
  try {
    // Convert empty ObjectId strings to undefined to prevent CastError
    const updateData = { ...req.body };
    const objectIdFields = ['brandId', 'categoryId', 'subcategoryId', 'seriesId', 'subSeriesId'];

    objectIdFields.forEach(field => {
      if (updateData[field] === '' || updateData[field] === null) {
        updateData[field] = undefined;
      }
    });

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
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

// Bulk update products (for applying discounts/tier prices to filtered products)
router.post('/products/bulk-update', async (req, res, next) => {
  try {
    const { filters, updates } = req.body;

    // Build query from filters
    const query = {};
    if (filters.brand) query.brand = filters.brand;
    if (filters.category) query.category = filters.category;
    if (filters.subcategory) query.subcategory = filters.subcategory;
    if (filters.series) query.series = filters.series;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { partNumber: { $regex: filters.search, $options: 'i' } },
        { brand: { $regex: filters.search, $options: 'i' } }
      ];
    }

    // Get all matching products
    const products = await Product.find(query);

    let modifiedCount = 0;

    // Helper function to calculate NLC and tier prices
    const calculatePrices = (product, newUpdates) => {
      const merged = { ...product.toObject(), ...newUpdates };
      const gstRate = parseFloat(merged.gstRate) || 0;

      // Calculate base price without GST
      let basePriceWithoutGst = 0;
      if (merged.basePriceType === 'mop') {
        basePriceWithoutGst = parseFloat(merged.mop) || 0;
      } else if (merged.basePriceType === 'purchase') {
        basePriceWithoutGst = parseFloat(merged.purchasePrice) || 0;
      } else if (merged.basePriceType === 'market') {
        basePriceWithoutGst = parseFloat(merged.marketPrice) || 0;
      } else {
        // Default to MOP
        basePriceWithoutGst = parseFloat(merged.mop) || 0;
      }

      // Add GST to get base price
      let nlc = basePriceWithoutGst * (1 + gstRate / 100);

      // Apply discounts
      for (let i = 1; i <= 5; i++) {
        const discountVal = parseFloat(merged[`dis${i}`]) || 0;
        const discountType = merged[`dis${i}Type`];
        if (discountType === 'percent') {
          nlc = nlc - (nlc * discountVal / 100);
        } else {
          nlc = nlc - discountVal;
        }
      }
      nlc = Math.round(nlc * 100) / 100;

      // Calculate price with profit
      let priceWithProfit = nlc;
      const profitVal = parseFloat(merged.profit) || 0;
      if (merged.profitType === 'percent') {
        priceWithProfit = nlc + (nlc * profitVal / 100);
      } else {
        priceWithProfit = nlc + profitVal;
      }

      // Helper to calculate OP price
      const calculateOpPrice = (opField, opTypeField, basePrice = priceWithProfit) => {
        const opVal = parseFloat(merged[opField]) || 0;
        const opType = merged[opTypeField];
        if (opType === 'flat') {
          // For flat margin: final price = basePrice + flatAmount
          return Math.round((basePrice + opVal) * 100) / 100;
        } else {
          // For percent margin: final price = basePrice * (1 + percentage/100)
          return Math.round((basePrice * (1 + opVal / 100)) * 100) / 100;
        }
      };

      // Determine base for SI prices: use marketPriceSI if set, otherwise priceWithProfit
      const siBase = (parseFloat(merged.marketPriceSI) > 0) ? parseFloat(merged.marketPriceSI) : priceWithProfit;
      // Determine base for T prices: use marketPriceReseller if set, otherwise priceWithProfit
      const tBase = (parseFloat(merged.marketPriceReseller) > 0) ? parseFloat(merged.marketPriceReseller) : priceWithProfit;

      // Calculate SI1 price from SI1 margin
      const si1Price = calculateOpPrice('opSi1', 'opSi1Type', siBase);

      // Calculate SI2 = SI1 + 1% (auto-calculated)
      const si2Price = Math.round(si1Price * 1.01 * 100) / 100;

      // Calculate C1 = SI1 + 20% (auto-calculated)
      const c1Price = Math.round(si1Price * 1.20 * 100) / 100;

      // Calculate T1 price from T1 margin
      const t1Price = calculateOpPrice('opT1', 'opT1Type', tBase);

      // Calculate T2 = T1 + 0.5% (auto-calculated)
      const t2Price = Math.round(t1Price * 1.005 * 100) / 100;

      return {
        nlc,
        c1: c1Price,
        si1: si1Price,
        si2: si2Price,
        t1: t1Price,
        t2: t2Price
      };
    };

    // Check if we're updating pricing-related fields
    const pricingFields = ['dis1', 'dis1Type', 'dis2', 'dis2Type', 'dis3', 'dis3Type', 'dis4', 'dis4Type', 'dis5', 'dis5Type', 'opSi1', 'opSi1Type', 'opT1', 'opT1Type', 'mrp', 'mop', 'purchasePrice', 'marketPrice', 'marketPriceSI', 'marketPriceReseller', 'basePriceType', 'gstRate', 'profit', 'profitType'];
    const isPricingUpdate = Object.keys(updates).some(key => pricingFields.includes(key));

    // Update each product
    for (const product of products) {
      if (isPricingUpdate) {
        // Calculate new prices
        const prices = calculatePrices(product, updates);

        // Merge updates with calculated prices
        const finalUpdates = {
          ...updates,
          nlc: prices.nlc,
          // Store calculated tier prices
          c1: prices.c1,
          si1: prices.si1,
          si2: prices.si2,
          t1: prices.t1,
          t2: prices.t2
        };

        await Product.findByIdAndUpdate(product._id, { $set: finalUpdates });
      } else {
        // Just apply the raw updates
        await Product.findByIdAndUpdate(product._id, { $set: updates });
      }
      modifiedCount++;
    }

    res.json({
      success: true,
      message: `Updated ${modifiedCount} products`,
      data: {
        matched: products.length,
        modified: modifiedCount
      }
    });
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
      Brand.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
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

// ============================================
// CONTACTS ROUTES
// ============================================

// Get all contacts with pagination and filtering
router.get('/contacts', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search, customer } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (customer) {
      // Search in both single customer field and customers array
      query.$or = [
        { customer: customer },
        { customers: customer }
      ];
    }

    if (search) {
      const searchConditions = [
        { name: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { firmName: { $regex: search, $options: 'i' } },
        { mobile1: { $regex: search, $options: 'i' } },
        { mobile2: { $regex: search, $options: 'i' } },
        { mobile3: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];

      // If we already have a $or from customer filter, combine with $and
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions }
        ];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .populate('customers', 'firmName name mobile')
        .populate('customer', 'firmName name mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Contact.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: contacts,
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

// Get unique designations from contacts (MUST be before /:id routes)
router.get('/contacts/designations', async (req, res, next) => {
  try {
    const designations = await Contact.distinct('designation', { designation: { $ne: null, $ne: '' } });
    res.json({
      success: true,
      data: designations.filter(Boolean).sort()
    });
  } catch (error) {
    next(error);
  }
});

// Get single contact
router.get('/contacts/:id', async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('customers', 'firmName name mobile')
      .populate('customer', 'firmName name mobile');
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
});

// Create new contact
router.post('/contacts', async (req, res, next) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      name,
      customer,
      customers, // New field for multiple customers
      firmName,
      designation,
      landmark,
      city,
      mobile1,
      mobile1WhatsApp,
      mobile2,
      mobile2WhatsApp,
      mobile3,
      mobile3WhatsApp,
      email,
      photo,
      aadharCard,
      panCard,
      isPrimary,
      status,
      notes
    } = req.body;

    // Compute full name from parts
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ') || name;

    // Validation
    if (!firstName && !name) {
      return res.status(400).json({
        success: false,
        message: 'First name is required'
      });
    }

    // Handle customers array (new) or single customer (backward compatibility)
    let customerIds = [];
    if (customers && Array.isArray(customers) && customers.length > 0) {
      customerIds = customers.filter(id => id && id !== '');
    } else if (customer) {
      customerIds = [customer];
    }

    // Fetch firm names from customers
    let finalFirmName = firmName;
    const customerDocs = [];
    if (customerIds.length > 0) {
      for (const custId of customerIds) {
        const doc = await Customer.findById(custId);
        if (doc) {
          customerDocs.push(doc);
          if (!finalFirmName && doc.firmName) {
            finalFirmName = doc.firmName;
          }
        }
      }
    }

    // Check for duplicate mobile numbers across contacts
    const contactMobileNumbers = [mobile1, mobile2, mobile3].filter(n => n && n.trim() !== '');
    if (contactMobileNumbers.length > 0) {
      const existingContact = await Contact.findOne({
        $or: contactMobileNumbers.flatMap(num => [
          { mobile1: num },
          { mobile2: num },
          { mobile3: num }
        ])
      });
      if (existingContact) {
        return res.status(400).json({
          success: false,
          message: `A contact with this mobile number already exists`
        });
      }
    }

    // Check for duplicate email across contacts
    if (email && email.trim() !== '') {
      const existingContactEmail = await Contact.findOne({ email: email.trim().toLowerCase() });
      if (existingContactEmail) {
        return res.status(400).json({
          success: false,
          message: `A contact with this email already exists`
        });
      }
    }

    const contact = await Contact.create({
      firstName: firstName || undefined,
      middleName: middleName || undefined,
      lastName: lastName || undefined,
      name: fullName || name,
      customers: customerIds,
      customer: customerIds[0] || null, // Backward compatibility
      firmName: finalFirmName,
      designation: designation || undefined,
      landmark: landmark || undefined,
      city: city || undefined,
      mobile1: mobile1 || undefined,
      mobile1WhatsApp: mobile1WhatsApp || false,
      mobile2: mobile2 || undefined,
      mobile2WhatsApp: mobile2WhatsApp || false,
      mobile3: mobile3 || undefined,
      mobile3WhatsApp: mobile3WhatsApp || false,
      email: email || undefined,
      photo: photo || undefined,
      aadharCard: aadharCard || undefined,
      panCard: panCard || undefined,
      isPrimary: isPrimary || false,
      status: status || 'active',
      notes: notes || undefined
    });

    // Populate customers before returning
    await contact.populate('customers', 'firmName name mobile');
    await contact.populate('customer', 'firmName name mobile');

    // Sync to each customer's contactPersons array
    for (const customerDoc of customerDocs) {
      try {
        // Check if this contact already exists in contactPersons by name OR mobile
        const existingByNameIndex = customerDoc.contactPersons.findIndex(
          cp => cp.name && cp.name.toLowerCase() === fullName.toLowerCase()
        );

        if (existingByNameIndex === -1) {
          // If this is primary, unmark other contacts
          if (isPrimary) {
            customerDoc.contactPersons.forEach(cp => {
              cp.isPrimary = false;
            });
          }
          // Add new contact person
          customerDoc.contactPersons.push({
            name: fullName,
            designation,
            mobile: mobile1,
            email,
            isPrimary: isPrimary || customerDoc.contactPersons.length === 0,
            isWhatsApp: mobile1WhatsApp || false
          });
          await customerDoc.save();
        }
      } catch (syncError) {
        console.error('Failed to sync contact to customer:', syncError.message);
        // Don't fail the main operation
      }
    }

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: contact
    });
  } catch (error) {
    next(error);
  }
});

// Update contact
router.put('/contacts/:id', async (req, res, next) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      name,
      customer,
      customers, // New field for multiple customers
      firmName,
      designation,
      landmark,
      city,
      mobile1,
      mobile1WhatsApp,
      mobile2,
      mobile2WhatsApp,
      mobile3,
      mobile3WhatsApp,
      email,
      photo,
      aadharCard,
      panCard,
      isPrimary,
      status,
      notes
    } = req.body;

    // Compute full name from parts
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ') || name;

    // Get the existing contact before update
    const existingContact = await Contact.findById(req.params.id);

    // Handle customers array (new) or single customer (backward compatibility)
    let customerIds = [];
    if (customers && Array.isArray(customers) && customers.length > 0) {
      customerIds = customers.filter(id => id && id !== '');
    } else if (customer) {
      customerIds = [customer];
    }

    // Fetch firm names from customers
    let finalFirmName = firmName;
    const customerDocs = [];
    for (const custId of customerIds) {
      const doc = await Customer.findById(custId);
      if (doc) {
        customerDocs.push(doc);
        if (!finalFirmName && doc.firmName) {
          finalFirmName = doc.firmName;
        }
      }
    }

    // Check for duplicate mobile numbers across contacts (excluding current contact)
    const contactMobileNumbers = [mobile1, mobile2, mobile3].filter(n => n && n.trim() !== '');
    if (contactMobileNumbers.length > 0) {
      const existingContactMobile = await Contact.findOne({
        _id: { $ne: req.params.id },
        $or: contactMobileNumbers.flatMap(num => [
          { mobile1: num },
          { mobile2: num },
          { mobile3: num }
        ])
      });
      if (existingContactMobile) {
        return res.status(400).json({
          success: false,
          message: `A contact with this mobile number already exists`
        });
      }
    }

    // Check for duplicate email across contacts (excluding current contact)
    if (email && email.trim() !== '') {
      const existingContactEmail = await Contact.findOne({
        _id: { $ne: req.params.id },
        email: email.trim().toLowerCase()
      });
      if (existingContactEmail) {
        return res.status(400).json({
          success: false,
          message: `A contact with this email already exists`
        });
      }
    }

    const updateData = {
      firstName: firstName || undefined,
      middleName: middleName || undefined,
      lastName: lastName || undefined,
      name: fullName || name,
      customers: customerIds,
      customer: customerIds[0] || null, // Backward compatibility
      firmName: finalFirmName,
      designation: designation || undefined,
      landmark: landmark || undefined,
      city: city || undefined,
      mobile1: mobile1 || undefined,
      mobile1WhatsApp: mobile1WhatsApp || false,
      mobile2: mobile2 || undefined,
      mobile2WhatsApp: mobile2WhatsApp || false,
      mobile3: mobile3 || undefined,
      mobile3WhatsApp: mobile3WhatsApp || false,
      email: email || undefined,
      photo: photo || undefined,
      aadharCard: aadharCard || undefined,
      panCard: panCard || undefined,
      isPrimary: isPrimary || false,
      status,
      notes: notes || undefined
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('customers', 'firmName name mobile');
    await contact.populate('customer', 'firmName name mobile');

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    // Sync changes to customer's contactPersons array
    try {
      // Get old customers from existing contact (support both array and single)
      const oldCustomerIds = existingContact?.customers ||
        (existingContact?.customer ? [existingContact.customer.toString()] : []);
      const newCustomerIds = customerIds.map(id => id.toString());

      // Remove from customers that are no longer linked
      for (const oldId of oldCustomerIds) {
        if (!newCustomerIds.includes(oldId)) {
          const oldCustomer = await Customer.findById(oldId);
          if (oldCustomer && existingContact?.name) {
            oldCustomer.contactPersons = oldCustomer.contactPersons.filter(
              cp => !cp.name || cp.name.toLowerCase() !== existingContact.name.toLowerCase()
            );
            await oldCustomer.save();
          }
        }
      }

      // Add/update to new customers
      for (const customerDoc of customerDocs) {
        // Find existing by name
        const existingContactIndex = customerDoc.contactPersons.findIndex(
          cp => cp.name && fullName && cp.name.toLowerCase() === fullName.toLowerCase()
        );

        // If this is primary, unmark other contacts
        if (isPrimary) {
          customerDoc.contactPersons.forEach((cp, index) => {
            if (index !== existingContactIndex) {
              cp.isPrimary = false;
            }
          });
        }

        if (existingContactIndex !== -1) {
          // Update existing contact person
          customerDoc.contactPersons[existingContactIndex].name = fullName;
          customerDoc.contactPersons[existingContactIndex].designation = designation;
          customerDoc.contactPersons[existingContactIndex].mobile = mobile1;
          customerDoc.contactPersons[existingContactIndex].email = email;
          customerDoc.contactPersons[existingContactIndex].isPrimary = isPrimary || false;
          customerDoc.contactPersons[existingContactIndex].isWhatsApp = mobile1WhatsApp || false;
        } else {
          // Add new contact person
          customerDoc.contactPersons.push({
            name: fullName,
            designation,
            mobile: mobile1,
            email,
            isPrimary: isPrimary || customerDoc.contactPersons.length === 0,
            isWhatsApp: mobile1WhatsApp || false
          });
        }
        await customerDoc.save();
      }
    } catch (syncError) {
      console.error('Failed to sync contact to customer:', syncError.message);
      // Don't fail the main operation
    }

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: contact
    });
  } catch (error) {
    next(error);
  }
});

// Delete contact
router.delete('/contacts/:id', async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    // Store contact info before deletion (support both array and single)
    const customerIds = contact.customers?.length > 0
      ? contact.customers
      : (contact.customer ? [contact.customer] : []);
    const contactName = contact.name;

    // Delete the contact
    await Contact.findByIdAndDelete(req.params.id);

    // Remove from all linked customers' contactPersons arrays
    for (const custId of customerIds) {
      try {
        const customerDoc = await Customer.findById(custId);
        if (customerDoc && contactName) {
          customerDoc.contactPersons = customerDoc.contactPersons.filter(
            cp => !cp.name || cp.name.toLowerCase() !== contactName.toLowerCase()
          );
          await customerDoc.save();
        }
      } catch (syncError) {
        console.error('Failed to sync contact deletion to customer:', syncError.message);
        // Don't fail the main operation
      }
    }

    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get contacts by customer ID
router.get('/customers/:id/contacts', async (req, res, next) => {
  try {
    // Find contacts where customer matches OR customers array contains the ID
    const contacts = await Contact.find({
      $or: [
        { customer: req.params.id },
        { customers: req.params.id }
      ]
    })
      .populate('customers', 'firmName name mobile')
      .populate('customer', 'firmName name mobile')
      .sort({ isPrimary: -1, createdAt: -1 });

    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    next(error);
  }
});

export default router;