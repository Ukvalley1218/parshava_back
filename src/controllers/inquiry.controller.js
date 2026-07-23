import inquiryService from '../services/inquiry.service.js';
import Inquiry from '../models/inquiry.model.js';

// Helper to check if user is authorized to act on an inquiry (creator, assignee, or admin)
const isAuthorizedForInquiry = (inquiry, user) => {
  const userId = user._id.toString();
  const isCreator = inquiry.createdBy?.toString() === userId;
  const isAssignee = inquiry.assignedTo?.toString() === userId;
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';
  return isCreator || isAssignee || isAdmin;
};

// @desc    Create a new inquiry
// @route   POST /api/inquiries
// @access  Private
export const createInquiry = async (req, res, next) => {
  try {
    const inquiry = await inquiryService.createInquiry(
      req.body.customerId,
      req.user._id
    );

    res.status(201).json({
      success: true,
      message: 'Inquiry created successfully',
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all inquiries with pagination and filters
// @route   GET /api/inquiries
// @access  Private
export const getInquiries = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;

    const result = await inquiryService.getInquiries({
      page: page || 1,
      limit: limit || 10,
      status: status || '',
      userId: req.user._id // Filter by logged-in user
    });

    res.json({
      success: true,
      data: result.inquiries,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inquiry by ID
// @route   GET /api/inquiries/:id
// @access  Private
export const getInquiryById = async (req, res, next) => {
  try {
    const inquiry = await inquiryService.getInquiryById(req.params.id, req.user._id);

    res.json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    if (error.message === 'Inquiry not found') {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }
    next(error);
  }
};

// @desc    Update inquiry
// @route   PATCH /api/inquiries/:id
// @access  Private
export const updateInquiry = async (req, res, next) => {
  try {
    // Authorization check
    const inquiryDoc = await Inquiry.findById(req.params.id);
    if (!inquiryDoc || inquiryDoc.status === 'cancelled') {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    if (!isAuthorizedForInquiry(inquiryDoc, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this inquiry' });
    }

    const inquiry = await inquiryService.updateInquiry(
      req.params.id,
      req.body
    );

    res.json({
      success: true,
      message: 'Inquiry updated successfully',
      data: inquiry
    });
  } catch (error) {
    if (error.message === 'Inquiry not found') {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }
    next(error);
  }
};

// @desc    Delete inquiry (soft delete)
// @route   DELETE /api/inquiries/:id
// @access  Private
export const deleteInquiry = async (req, res, next) => {
  try {
    // Authorization check
    const inquiryDoc = await Inquiry.findById(req.params.id);
    if (!inquiryDoc || inquiryDoc.status === 'cancelled') {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    if (!isAuthorizedForInquiry(inquiryDoc, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this quotation' });
    }

    await inquiryService.deleteInquiry(req.params.id);

    res.json({
      success: true,
      message: 'Inquiry deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Inquiry not found') {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }
    next(error);
  }
};

// @desc    Add product to inquiry
// @route   POST /api/inquiries/:id/add-product
// @access  Private
export const addProduct = async (req, res, next) => {
  try {
    // Authorization check
    const inquiryDoc = await Inquiry.findById(req.params.id);
    if (!inquiryDoc || inquiryDoc.status === 'cancelled') {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    if (!isAuthorizedForInquiry(inquiryDoc, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this inquiry' });
    }

    const inquiry = await inquiryService.addProductToInquiry(
      req.params.id,
      req.body.productId,
      req.body.qty,
      req.body.discount
    );

    res.json({
      success: true,
      message: 'Product added to inquiry',
      data: inquiry
    });
  } catch (error) {
    if (error.message === 'Inquiry not found') {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    next(error);
  }
};

// @desc    Update product in inquiry
// @route   PATCH /api/inquiries/:id/update-product
// @access  Private
export const updateProduct = async (req, res, next) => {
  try {
    // Authorization check
    const inquiryDoc = await Inquiry.findById(req.params.id);
    if (!inquiryDoc || inquiryDoc.status === 'cancelled') {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    if (!isAuthorizedForInquiry(inquiryDoc, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this inquiry' });
    }

    const inquiry = await inquiryService.updateInquiryProduct(
      req.params.id,
      req.body.productId,
      req.body.qty,
      req.body.discount
    );

    res.json({
      success: true,
      message: 'Product updated in inquiry',
      data: inquiry
    });
  } catch (error) {
    if (error.message === 'Inquiry not found') {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }
    if (error.message === 'Product not found in inquiry') {
      return res.status(404).json({
        success: false,
        message: 'Product not found in inquiry'
      });
    }
    next(error);
  }
};

// @desc    Remove product from inquiry
// @route   DELETE /api/inquiries/:id/remove-product
// @access  Private
export const removeProduct = async (req, res, next) => {
  try {
    // Authorization check
    const inquiryDoc = await Inquiry.findById(req.params.id);
    if (!inquiryDoc || inquiryDoc.status === 'cancelled') {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    if (!isAuthorizedForInquiry(inquiryDoc, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this inquiry' });
    }

    const inquiry = await inquiryService.removeInquiryProduct(
      req.params.id,
      req.body.productId
    );

    res.json({
      success: true,
      message: 'Product removed from inquiry',
      data: inquiry
    });
  } catch (error) {
    if (error.message === 'Inquiry not found') {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }
    next(error);
  }
};

// ============================================
// CART CONTROLLERS
// ============================================

// @desc    Get user's cart (draft inquiry)
// @route   GET /api/inquiries/cart
// @access  Private
export const getCart = async (req, res, next) => {
  try {
    const cart = await inquiryService.getOrCreateCart(req.user._id);

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to cart
// @route   POST /api/inquiries/cart/add
// @access  Private
export const addToCart = async (req, res, next) => {
  try {
    const { productId, qty = 1, discount = 0 } = req.body;

    const cart = await inquiryService.addToCart(
      req.user._id,
      productId,
      qty,
      discount
    );

    res.json({
      success: true,
      message: 'Product added to cart',
      data: cart
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

// @desc    Update product in cart
// @route   PATCH /api/inquiries/cart/update/:productId
// @access  Private
export const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { qty, discount } = req.body;

    const cart = await inquiryService.updateCartItem(
      req.user._id,
      productId,
      { qty, discount }
    );

    res.json({
      success: true,
      message: 'Cart updated',
      data: cart
    });
  } catch (error) {
    if (error.message === 'Cart not found') {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    if (error.message === 'Product not found in cart') {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      });
    }
    next(error);
  }
};

// @desc    Remove product from cart
// @route   DELETE /api/inquiries/cart/remove/:productId
// @access  Private
export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await inquiryService.removeFromCart(
      req.user._id,
      productId
    );

    res.json({
      success: true,
      message: 'Product removed from cart',
      data: cart
    });
  } catch (error) {
    if (error.message === 'Cart not found') {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    next(error);
  }
};

// @desc    Clear cart (remove all items)
// @route   DELETE /api/inquiries/cart/clear
// @access  Private
export const clearCart = async (req, res, next) => {
  try {
    const cart = await inquiryService.clearCart(req.user._id);

    res.json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit cart as inquiry
// @route   POST /api/inquiries/cart/submit
// @access  Private
export const submitCart = async (req, res, next) => {
  try {
    console.log('=== SUBMIT CART REQUEST ===');
    console.log('Full req.body:', JSON.stringify(req.body, null, 2));
    const { customerId, notes, contactPerson } = req.body;
    console.log('Extracted values:', { customerId, notes, contactPerson });
    console.log('contactPerson type:', typeof contactPerson);
    console.log('contactPerson value:', contactPerson);

    const inquiry = await inquiryService.submitCart(
      req.user._id,
      customerId,
      notes,
      contactPerson
    );
    console.log('Created inquiry with contactPerson:', inquiry.contactPerson);

    res.json({
      success: true,
      message: 'Inquiry created successfully',
      data: inquiry
    });
  } catch (error) {
    if (error.message === 'Cart is empty') {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }
    next(error);
  }
};

// @desc    Assign inquiry to another user
// @route   POST /api/inquiries/:id/assign
// @access  Private
export const assignInquiry = async (req, res, next) => {
  try {
    const { assignedToUserId } = req.body;

    if (!assignedToUserId) {
      return res.status(400).json({
        success: false,
        message: 'assignedToUserId is required'
      });
    }

    // Check that the inquiry exists and belongs to the user (or is assigned to them)
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry || inquiry.status === 'cancelled') {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    // Only the creator, current assignee, or admin can reassign
    const isCreator = inquiry.createdBy?.toString() === req.user._id.toString();
    const isAssignee = inquiry.assignedTo?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    if (!isCreator && !isAssignee && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only assign inquiries you created or are assigned to'
      });
    }

    // Can't assign to self
    if (assignedToUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot assign an inquiry to yourself'
      });
    }

    const updatedInquiry = await inquiryService.assignInquiry(
      req.params.id,
      assignedToUserId,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Inquiry assigned successfully',
      data: updatedInquiry
    });
  } catch (error) {
    if (error.message === 'Inquiry not found') {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }
    if (error.message === 'Assigned user not found or inactive') {
      return res.status(400).json({
        success: false,
        message: 'Assigned user not found or inactive'
      });
    }
    next(error);
  }
};

// @desc    Get users available for inquiry assignment
// @route   GET /api/inquiries/users
// @access  Private
export const getUsersForAssignment = async (req, res, next) => {
  try {
    const users = await inquiryService.getUsersForAssignment(req.user._id);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// QUOTATION CART CONTROLLERS
// ============================================

// @desc    Create a quotation cart (with customer pre-selected)
// @route   POST /api/inquiries/quotation
// @access  Private
export const createQuotationCart = async (req, res, next) => {
  try {
    const { customerId } = req.body;

    const quotation = await inquiryService.createQuotationCart(
      req.user._id,
      customerId
    );

    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: quotation
    });
  } catch (error) {
    if (error.message === 'Customer not found') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    next(error);
  }
};

// @desc    Get quotation by ID
// @route   GET /api/inquiries/quotation/:id
// @access  Private
export const getQuotation = async (req, res, next) => {
  try {
    const quotation = await inquiryService.getQuotationById(req.params.id);

    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    if (error.message === 'Quotation not found') {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }
    next(error);
  }
};

// @desc    Add product to quotation cart
// @route   POST /api/inquiries/quotation/:id/add-product
// @access  Private
export const addQuotationProduct = async (req, res, next) => {
  try {
    const { productId, qty, discount } = req.body;

    const quotation = await inquiryService.addProductToQuotationCart(
      req.params.id,
      productId,
      qty || 1,
      discount || 0
    );

    res.json({
      success: true,
      message: 'Product added to quotation',
      data: quotation
    });
  } catch (error) {
    if (error.message === 'Quotation not found') {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    next(error);
  }
};

// @desc    Update product in quotation cart
// @route   PATCH /api/inquiries/quotation/:id/update-product/:productId
// @access  Private
export const updateQuotationProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { qty, discount } = req.body;

    const quotation = await inquiryService.updateQuotationCartItem(
      req.params.id,
      productId,
      { qty, discount }
    );

    res.json({
      success: true,
      message: 'Product updated in quotation',
      data: quotation
    });
  } catch (error) {
    if (error.message === 'Quotation not found') {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }
    if (error.message === 'Product not found in quotation') {
      return res.status(404).json({
        success: false,
        message: 'Product not found in quotation'
      });
    }
    next(error);
  }
};

// @desc    Remove product from quotation cart
// @route   DELETE /api/inquiries/quotation/:id/remove-product/:productId
// @access  Private
export const removeQuotationProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const quotation = await inquiryService.removeQuotationCartItem(
      req.params.id,
      productId
    );

    res.json({
      success: true,
      message: 'Product removed from quotation',
      data: quotation
    });
  } catch (error) {
    if (error.message === 'Quotation not found') {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }
    next(error);
  }
};

// @desc    Submit quotation (finalize)
// @route   POST /api/inquiries/quotation/:id/submit
// @access  Private
export const submitQuotation = async (req, res, next) => {
  try {
    const { notes, contactPerson } = req.body;

    const quotation = await inquiryService.submitQuotationCart(
      req.params.id,
      notes,
      contactPerson
    );

    res.json({
      success: true,
      message: 'Quotation submitted successfully',
      data: quotation
    });
  } catch (error) {
    if (error.message === 'Quotation not found') {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }
    if (error.message === 'No customer assigned to this quotation') {
      return res.status(400).json({
        success: false,
        message: 'No customer assigned to this quotation'
      });
    }
    if (error.message === 'Quotation has no items') {
      return res.status(400).json({
        success: false,
        message: 'Quotation has no items'
      });
    }
    next(error);
  }
};