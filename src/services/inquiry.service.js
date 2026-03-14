import Inquiry from '../models/inquiry.model.js';
import Product from '../models/product.model.js';
import Customer from '../models/customer.model.js';

class InquiryService {
  /**
   * Calculate totals for inquiry
   * @param {Array} items - Array of inquiry items
   * @returns {Object} Calculated totals
   */
  calculateTotals(items) {
    let subtotal = 0;
    let discountTotal = 0;
    let gstTotal = 0;

    for (const item of items) {
      const itemSubtotal = item.price * item.qty;
      const itemDiscount = itemSubtotal * (item.discount / 100);
      const itemTaxableValue = itemSubtotal - itemDiscount;
      const itemGST = itemTaxableValue * (item.gstRate / 100);

      subtotal += itemSubtotal;
      discountTotal += itemDiscount;
      gstTotal += itemGST;
    }

    const grandTotal = subtotal - discountTotal + gstTotal;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      gstTotal: Math.round(gstTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100
    };
  }

  /**
   * Create a new inquiry
   * @param {String} customerId - Customer ID
   * @param {String} userId - User ID creating the inquiry
   * @returns {Object} Created inquiry
   */
  async createInquiry(customerId, userId) {
    const inquiry = await Inquiry.create({
      customerId,
      status: 'draft',
      items: [],
      subtotal: 0,
      discountTotal: 0,
      gstTotal: 0,
      grandTotal: 0,
      createdBy: userId
    });

    return inquiry.populate('customerId', 'name mobile email');
  }

  /**
   * Add product to inquiry
   * @param {String} inquiryId - Inquiry ID
   * @param {String} productId - Product ID to add
   * @param {Number} qty - Quantity
   * @param {Number} discount - Discount percentage
   * @returns {Object} Updated inquiry
   */
  async addProductToInquiry(inquiryId, productId, qty, discount = 0) {
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if product already exists in inquiry
    const existingItemIndex = inquiry.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update existing item
      inquiry.items[existingItemIndex].qty = qty;
      inquiry.items[existingItemIndex].discount = discount;
    } else {
      // Calculate item total
      const itemSubtotal = product.mrp * qty;
      const itemDiscount = itemSubtotal * (discount / 100);
      const itemTaxableValue = itemSubtotal - itemDiscount;
      const itemTotal = itemTaxableValue * (1 + product.gstRate / 100);

      // Add new item
      inquiry.items.push({
        productId: product._id,
        productName: product.name,
        price: product.mrp,
        qty,
        discount,
        gstRate: product.gstRate,
        total: Math.round(itemTotal * 100) / 100
      });
    }

    // Recalculate all totals
    const totals = this.calculateTotals(inquiry.items);
    inquiry.subtotal = totals.subtotal;
    inquiry.discountTotal = totals.discountTotal;
    inquiry.gstTotal = totals.gstTotal;
    inquiry.grandTotal = totals.grandTotal;

    await inquiry.save();
    return inquiry.populate('customerId', 'name mobile email');
  }

  /**
   * Update product in inquiry
   * @param {String} inquiryId - Inquiry ID
   * @param {String} productId - Product ID to update
   * @param {Number} qty - New quantity
   * @param {Number} discount - New discount percentage
   * @returns {Object} Updated inquiry
   */
  async updateInquiryProduct(inquiryId, productId, qty, discount = 0) {
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    const itemIndex = inquiry.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      throw new Error('Product not found in inquiry');
    }

    // Update item
    inquiry.items[itemIndex].qty = qty;
    inquiry.items[itemIndex].discount = discount;

    // Recalculate item total
    const item = inquiry.items[itemIndex];
    const itemSubtotal = item.price * qty;
    const itemDiscount = itemSubtotal * (discount / 100);
    const itemTaxableValue = itemSubtotal - itemDiscount;
    const itemTotal = itemTaxableValue * (1 + item.gstRate / 100);
    inquiry.items[itemIndex].total = Math.round(itemTotal * 100) / 100;

    // Recalculate all totals
    const totals = this.calculateTotals(inquiry.items);
    inquiry.subtotal = totals.subtotal;
    inquiry.discountTotal = totals.discountTotal;
    inquiry.gstTotal = totals.gstTotal;
    inquiry.grandTotal = totals.grandTotal;

    await inquiry.save();
    return inquiry.populate('customerId', 'name mobile email');
  }

  /**
   * Remove product from inquiry
   * @param {String} inquiryId - Inquiry ID
   * @param {String} productId - Product ID to remove
   * @returns {Object} Updated inquiry
   */
  async removeInquiryProduct(inquiryId, productId) {
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    // Filter out the product
    inquiry.items = inquiry.items.filter(
      item => item.productId.toString() !== productId
    );

    // Recalculate all totals
    const totals = this.calculateTotals(inquiry.items);
    inquiry.subtotal = totals.subtotal;
    inquiry.discountTotal = totals.discountTotal;
    inquiry.gstTotal = totals.gstTotal;
    inquiry.grandTotal = totals.grandTotal;

    await inquiry.save();
    return inquiry.populate('customerId', 'name mobile email');
  }

  /**
   * Get all inquiries with pagination and filters
   * @param {Object} options - Query options
   * @returns {Object} Inquiries with pagination info
   */
  async getInquiries({ page = 1, limit = 10, status = '' }) {
    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [inquiries, total] = await Promise.all([
      Inquiry.find(query)
        .populate('customerId', 'name mobile email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Inquiry.countDocuments(query)
    ]);

    return {
      inquiries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    };
  }

  /**
   * Get inquiry by ID
   * @param {String} inquiryId - Inquiry ID
   * @returns {Object} Inquiry details
   */
  async getInquiryById(inquiryId) {
    const inquiry = await Inquiry.findById(inquiryId)
      .populate('customerId', 'name mobile email address city state gstin')
      .populate('createdBy', 'name email');

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    return inquiry;
  }

  /**
   * Update inquiry
   * @param {String} inquiryId - Inquiry ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated inquiry
   */
  async updateInquiry(inquiryId, updateData) {
    const inquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('customerId', 'name mobile email')
      .populate('createdBy', 'name email');

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    return inquiry;
  }

  /**
   * Soft delete inquiry
   * @param {String} inquiryId - Inquiry ID
   * @returns {Boolean} Success status
   */
  async deleteInquiry(inquiryId) {
    const inquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      { status: 'cancelled' },
      { new: true }
    );

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    return true;
  }

  // ============================================
  // CART METHODS (Draft Inquiry for User)
  // ============================================

  /**
   * Get cart (draft inquiry) for user
   * @param {String} userId - User ID
   * @returns {Object} Cart inquiry or null
   */
  async getOrCreateCart(userId) {
    let cart = await Inquiry.findOne({
      createdBy: userId,
      status: 'draft',
      customerId: { $exists: false }
    }).populate('items.productId', 'name sku mrp gstRate images');

    // Only return existing cart, don't create a new one
    if (!cart) {
      return null;
    }

    return this.formatCartResponse(cart);
  }

  /**
   * Add product to cart
   * @param {String} userId - User ID
   * @param {String} productId - Product ID
   * @param {Number} qty - Quantity
   * @param {Number} discount - Discount percentage
   * @returns {Object} Updated cart
   */
  async addToCart(userId, productId, qty = 1, discount = 0) {
    let cart = await Inquiry.findOne({
      createdBy: userId,
      status: 'draft',
      customerId: { $exists: false }
    });

    if (!cart) {
      cart = await Inquiry.create({
        status: 'draft',
        items: [],
        subtotal: 0,
        discountTotal: 0,
        gstTotal: 0,
        grandTotal: 0,
        createdBy: userId
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update existing item quantity
      cart.items[existingItemIndex].qty += qty;
      cart.items[existingItemIndex].discount = discount;
    } else {
      // Calculate item total
      const itemSubtotal = product.mrp * qty;
      const itemDiscount = itemSubtotal * (discount / 100);
      const itemTaxableValue = itemSubtotal - itemDiscount;
      const itemTotal = itemTaxableValue * (1 + product.gstRate / 100);

      // Add new item
      cart.items.push({
        productId: product._id,
        productName: product.name,
        price: product.mrp,
        qty,
        discount,
        gstRate: product.gstRate,
        total: Math.round(itemTotal * 100) / 100
      });
    }

    // Recalculate all totals
    const totals = this.calculateTotals(cart.items);
    cart.subtotal = totals.subtotal;
    cart.discountTotal = totals.discountTotal;
    cart.gstTotal = totals.gstTotal;
    cart.grandTotal = totals.grandTotal;

    await cart.save();

    // Re-fetch to get populated product
    cart = await Inquiry.findById(cart._id).populate('items.productId', 'name sku mrp gstRate images');
    return this.formatCartResponse(cart);
  }

  /**
   * Update product in cart
   * @param {String} userId - User ID
   * @param {String} productId - Product ID
   * @param {Object} data - Update data (qty, discount)
   * @returns {Object} Updated cart
   */
  async updateCartItem(userId, productId, data) {
    const cart = await Inquiry.findOne({
      createdBy: userId,
      status: 'draft',
      customerId: { $exists: false }
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      throw new Error('Product not found in cart');
    }

    // Update item
    if (data.qty !== undefined) {
      cart.items[itemIndex].qty = data.qty;
    }
    if (data.discount !== undefined) {
      cart.items[itemIndex].discount = data.discount;
    }

    // Recalculate item total
    const item = cart.items[itemIndex];
    const itemSubtotal = item.price * item.qty;
    const itemDiscount = itemSubtotal * (item.discount / 100);
    const itemTaxableValue = itemSubtotal - itemDiscount;
    const itemTotal = itemTaxableValue * (1 + item.gstRate / 100);
    cart.items[itemIndex].total = Math.round(itemTotal * 100) / 100;

    // Recalculate all totals
    const totals = this.calculateTotals(cart.items);
    cart.subtotal = totals.subtotal;
    cart.discountTotal = totals.discountTotal;
    cart.gstTotal = totals.gstTotal;
    cart.grandTotal = totals.grandTotal;

    await cart.save();

    const updatedCart = await Inquiry.findById(cart._id).populate('items.productId', 'name sku mrp gstRate images');
    return this.formatCartResponse(updatedCart);
  }

  /**
   * Remove product from cart
   * @param {String} userId - User ID
   * @param {String} productId - Product ID
   * @returns {Object} Updated cart
   */
  async removeFromCart(userId, productId) {
    const cart = await Inquiry.findOne({
      createdBy: userId,
      status: 'draft',
      customerId: { $exists: false }
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    // Filter out the product
    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );

    // Recalculate all totals
    const totals = this.calculateTotals(cart.items);
    cart.subtotal = totals.subtotal;
    cart.discountTotal = totals.discountTotal;
    cart.gstTotal = totals.gstTotal;
    cart.grandTotal = totals.grandTotal;

    await cart.save();

    const updatedCart = await Inquiry.findById(cart._id).populate('items.productId', 'name sku mrp gstRate images');
    return this.formatCartResponse(updatedCart);
  }

  /**
   * Clear cart (remove all items)
   * @param {String} userId - User ID
   * @returns {Object} Empty cart
   */
  async clearCart(userId) {
    const cart = await Inquiry.findOne({
      createdBy: userId,
      status: 'draft',
      customerId: { $exists: false }
    });

    if (!cart) {
      // Return empty response if no cart exists
      return { items: [], subtotal: 0, discountTotal: 0, gstTotal: 0, grandTotal: 0 };
    }

    cart.items = [];
    cart.subtotal = 0;
    cart.discountTotal = 0;
    cart.gstTotal = 0;
    cart.grandTotal = 0;

    await cart.save();
    return this.formatCartResponse(cart);
  }

  /**
   * Submit cart as inquiry (assign customer and change status)
   * @param {String} userId - User ID
   * @param {String} customerId - Customer ID
   * @param {String} notes - Optional notes
   * @returns {Object} Created inquiry
   */
async submitCart(userId, customerId, notes = '') {

  const cart = await Inquiry.findOne({
    createdBy: userId,
    status: 'draft',
    customerId: { $exists: false }
  });

  if (!cart || cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new Error('Customer not found');
  }

  cart.customerId = customerId;

  cart.customerDetails = {
    name: customer.name,
    mobile: customer.mobile,
    email: customer.email,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    gstin: customer.gstin
  };

  cart.notes = notes;

  cart.status = 'draft';

  await cart.save();

  return cart;
}

  /**
   * Format cart response for frontend
   * @param {Object} cart - Cart inquiry document
   * @returns {Object} Formatted response
   */
  formatCartResponse(cart) {
    if (!cart) {
      return { items: [], subtotal: 0, discountTotal: 0, gstTotal: 0, grandTotal: 0 };
    }

    const items = cart.items.map(item => {
      // Handle both populated and unpopulated productId
      const productIdStr = item.productId && typeof item.productId === 'object'
        ? item.productId._id.toString()
        : item.productId?.toString();

      const product = item.productId && typeof item.productId === 'object' ? {
        _id: item.productId._id,
        name: item.productId.name,
        sku: item.productId.partNumber,
        mrp: item.productId.mrp,
        gstRate: item.productId.gstRate,
        brand: item.productId.brand,
        category: item.productId.category
      } : null;

      return {
        _id: item._id,
        productId: productIdStr,
        productName: item.productName,
        name: item.productName,
        price: item.price,
        qty: item.qty,
        quantity: item.qty,
        discount: item.discount,
        gstRate: item.gstRate,
        total: item.total,
        product: product
      };
    });

    return {
      _id: cart._id,
      items,
      subtotal: cart.subtotal,
      discountTotal: cart.discountTotal,
      gstTotal: cart.gstTotal,
      grandTotal: cart.grandTotal,
      status: cart.status,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    };
  }
}

export default new InquiryService();