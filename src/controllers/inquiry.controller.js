import inquiryService from '../services/inquiry.service.js';

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
      status: status || ''
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
    const inquiry = await inquiryService.getInquiryById(req.params.id);

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
    const { customerId, notes } = req.body;

    const inquiry = await inquiryService.submitCart(
      req.user._id,
      customerId,
      notes
    );

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