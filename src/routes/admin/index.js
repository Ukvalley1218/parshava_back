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
        { companyName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Customer.countDocuments(query)
    ]);

    res.json({ success: true, data: customers, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalItems: total } });
  } catch (error) { next(error); }
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
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, message: 'Customer created successfully', data: customer });
  } catch (error) { next(error); }
});

router.put('/customers/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer updated successfully', data: customer });
  } catch (error) { next(error); }
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
    const { page = 1, limit = 10, brand, category, search } = req.query;
    const query = {};

    if (brand) query.brand = brand;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
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
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) { next(error); }
});

router.put('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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

export default router;