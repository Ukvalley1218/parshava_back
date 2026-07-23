import Inquiry from '../models/inquiry.model.js';
import Product from '../models/product.model.js';
import Customer from '../models/customer.model.js';
import User from '../models/User.js';

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
   * Get price based on customer's price list category
   * @param {Object} product - Product document
   * @param {String} priceListCategory - Customer's price list (T1, T2, T3, T4)
   * @returns {Number} Appropriate price for the customer
   */
  getPriceForCustomer(product, priceListCategory) {
    // Map price list to tier prices
    const priceMap = {
      'C1': product.c1 || product.opC1 || product.opPrice,
      'SI1': product.si1 || product.opSi1,
      'SI2': product.si2 || product.opSi2,
      'T1': product.t1 || product.op1 || product.opPrice,
      'T2': product.t2 || product.op2,
      'T3': product.t3 || product.op3,
      'T4': product.t4 || product.op4
    };

    // Get price based on customer's price list, fallback to opPrice -> mop -> mrp
    return priceMap[priceListCategory] || product.opPrice || product.mop || product.mrp || 0;
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
    const inquiry = await Inquiry.findById(inquiryId).populate('customerId');
    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Get customer's price list category
    const priceListCategory = inquiry.customerId?.priceListCategory || 'T1';

    // Check if product already exists in inquiry
    const existingItemIndex = inquiry.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update existing item
      inquiry.items[existingItemIndex].qty = qty;
      inquiry.items[existingItemIndex].discount = discount;
    } else {
      // Get price based on customer's price list
      const sellingPrice = this.getPriceForCustomer(product, priceListCategory);

      // Calculate item total
      const itemSubtotal = sellingPrice * qty;
      const itemDiscount = itemSubtotal * (discount / 100);
      const itemTaxableValue = itemSubtotal - itemDiscount;
      const itemTotal = itemTaxableValue * (1 + product.gstRate / 100);

      // Add new item
      inquiry.items.push({
        productId: product._id,
        productName: product.name,
        brand: product.brand,
        category: product.category,
        subcategory: product.subcategory,
        partNumber: product.partNumber,
        series: product.series,
        boxSize: product.boxSize,
        stock: product.stock,
        shortDescription: product.shortDescription,
        price: sellingPrice,
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
   * Only returns inquiries that have been submitted (have a customer assigned)
   * Draft carts without customers are considered abandoned and not shown
   * @param {Object} options - Query options
   * @returns {Object} Inquiries with pagination info
   */
  async getInquiries({ page = 1, limit = 10, status = '', userId = null }) {
    const query = {
      customerId: { $exists: true, $ne: null }, // Only show inquiries with a customer assigned
      status: { $ne: 'cancelled' } // Exclude cancelled (soft-deleted) inquiries by default
    };

    // Filter by user - show user's own inquiries AND inquiries assigned to them
    if (userId) {
      query.$or = [
        { createdBy: userId },
        { assignedTo: userId }
      ];
    }

    // Filter by status (override default status filter)
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [inquiries, total] = await Promise.all([
      Inquiry.find(query)
        .populate('customerId', 'name firmName mobile email')
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email role')
        .populate('assignedBy', 'name email role')
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
   * @param {String} userId - User ID (optional, for authorization)
   * @returns {Object} Inquiry details
   */
  async getInquiryById(inquiryId, userId = null) {
    const query = { _id: inquiryId };

    // If userId is provided, only return inquiry if it belongs to the user or is assigned to them
    if (userId) {
      query.$or = [
        { createdBy: userId },
        { assignedTo: userId }
      ];
    }

    const inquiry = await Inquiry.findOne(query)
      .populate('customerId', 'name mobile email address city state gstin')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role');

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    // Don't return cancelled inquiries
    if (inquiry.status === 'cancelled') {
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
    }).populate('items.productId', 'name partNumber brand category subcategory series boxSize stock shortDescription mrp mop opPrice gstRate imgurl imageUrl');

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
      // Use opPrice (selling price) or fallback to mop/mrp
      const sellingPrice = product.opPrice || product.mop || product.mrp || 0;

      // Calculate item total
      const itemSubtotal = sellingPrice * qty;
      const itemDiscount = itemSubtotal * (discount / 100);
      const itemTaxableValue = itemSubtotal - itemDiscount;
      const itemTotal = itemTaxableValue * (1 + product.gstRate / 100);

      // Add new item
      cart.items.push({
        productId: product._id,
        productName: product.name,
        brand: product.brand,
        category: product.category,
        subcategory: product.subcategory,
        partNumber: product.partNumber,
        series: product.series,
        boxSize: product.boxSize,
        stock: product.stock,
        shortDescription: product.shortDescription,
        imgurl: product.imgurl || product.imageUrl,
        price: sellingPrice,
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
    cart = await Inquiry.findById(cart._id).populate('items.productId', 'name partNumber brand category subcategory mrp mop opPrice gstRate imgurl imageUrl');
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

    const updatedCart = await Inquiry.findById(cart._id).populate('items.productId', 'name sku brand category subcategory series boxSize stock shortDescription mrp gstRate imgurl images');
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

    const updatedCart = await Inquiry.findById(cart._id).populate('items.productId', 'name sku brand category subcategory series boxSize stock shortDescription mrp gstRate imgurl images');
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
   * @param {Object} contactPerson - Optional contact person details
   * @returns {Object} Created inquiry
   */
  async submitCart(userId, customerId, notes = '', contactPerson = null) {
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

    // Get customer's price list category
    const priceListCategory = customer.priceListCategory || 'T1';

    // Recalculate prices based on customer's price list
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        // Get the correct price based on customer's price list
        const correctPrice = this.getPriceForCustomer(product, priceListCategory);
        item.price = correctPrice;

        // Recalculate item total
        const itemSubtotal = correctPrice * item.qty;
        const itemDiscount = itemSubtotal * (item.discount / 100);
        const itemTaxableValue = itemSubtotal - itemDiscount;
        item.total = Math.round((itemTaxableValue * (1 + item.gstRate / 100)) * 100) / 100;
      }
    }

    // Recalculate all totals
    const totals = this.calculateTotals(cart.items);
    cart.subtotal = totals.subtotal;
    cart.discountTotal = totals.discountTotal;
    cart.gstTotal = totals.gstTotal;
    cart.grandTotal = totals.grandTotal;

    cart.customerId = customerId;

    cart.customerDetails = {
      name: customer.name || customer.firmName || 'Unknown',
      firmName: customer.firmName || customer.name || 'Unknown',
      mobile: customer.mobile,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      gstin: customer.gstin,
      priceListCategory: priceListCategory
    };

    // Store contact person if provided
    if (contactPerson) {
      console.log('Saving contact person:', JSON.stringify(contactPerson, null, 2));
      cart.contactPerson = {
        name: contactPerson.name || '',
        designation: contactPerson.designation || '',
        mobile: contactPerson.mobile || '',
        email: contactPerson.email || '',
        isPrimary: contactPerson.isPrimary || false,
        isWhatsApp: contactPerson.isWhatsApp !== false
      };
      console.log('Cart contactPerson after assignment:', JSON.stringify(cart.contactPerson, null, 2));
    } else {
      console.log('No contact person provided');
    }

    cart.notes = notes;

    cart.status = 'draft';

    // Generate inquiry ID
    const inquiryCount = await Inquiry.countDocuments();
    cart.inquiryId = `INQ${String(inquiryCount + 1).padStart(6, '0')}`;

    await cart.save();
    console.log('Cart after save, contactPerson:', JSON.stringify(cart.contactPerson, null, 2));

    // Populate customerId before returning
    const result = await cart.populate('customerId', 'name mobile email');
    console.log('Final result contactPerson:', JSON.stringify(result.contactPerson, null, 2));
    return result;
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
        partNumber: item.productId.partNumber,
        sku: item.productId.partNumber,
        mrp: item.productId.mrp,
        mop: item.productId.mop,
        opPrice: item.productId.opPrice,
        gstRate: item.productId.gstRate,
        brand: item.productId.brand,
        category: item.productId.category,
        subcategory: item.productId.subcategory,
        series: item.productId.series,
        boxSize: item.productId.boxSize,
        stock: item.productId.stock,
        shortDescription: item.productId.shortDescription,
        imgurl: item.productId.imgurl || item.productId.imageUrl
      } : null;

      return {
        _id: item._id,
        productId: productIdStr,
        productName: item.productName,
        name: item.productName,
        brand: item.brand || product?.brand,
        category: item.category || product?.category,
        subcategory: item.subcategory || product?.subcategory,
        series: item.series || product?.series,
        partNumber: item.partNumber || product?.partNumber,
        boxSize: item.boxSize || product?.boxSize,
        stock: item.stock ?? product?.stock ?? 0,
        shortDescription: item.shortDescription || product?.shortDescription,
        imgurl: item.imgurl || (product?.imgurl) || null,
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

  /**
   * Assign inquiry to a user
   * @param {String} inquiryId - Inquiry ID
   * @param {String} assignedToUserId - User ID to assign the inquiry to
   * @param {String} assignedByUserId - User ID who is assigning the inquiry
   * @returns {Object} Updated inquiry with populated fields
   */
  async assignInquiry(inquiryId, assignedToUserId, assignedByUserId) {
    const inquiry = await Inquiry.findById(inquiryId);

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    // Don't allow assigning cancelled inquiries
    if (inquiry.status === 'cancelled') {
      throw new Error('Cannot assign a cancelled inquiry');
    }

    // Verify the assigned user exists and is active
    const assignedUser = await User.findById(assignedToUserId);
    if (!assignedUser || !assignedUser.isActive) {
      throw new Error('Assigned user not found or inactive');
    }

    inquiry.assignedTo = assignedToUserId;
    inquiry.assignedBy = assignedByUserId;
    inquiry.assignedAt = new Date();

    await inquiry.save();

    // Return populated inquiry
    return Inquiry.findById(inquiry._id)
      .populate('customerId', 'name mobile email address city state gstin')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role');
  }

  /**
   * Get users available for inquiry assignment
   * @param {String} excludeUserId - Current user ID to exclude from list
   * @returns {Array} List of active users
   */
  async getUsersForAssignment(excludeUserId = null) {
    const query = { isActive: true };
    const users = await User.find(query)
      .select('name email role')
      .sort({ name: 1 })
      .lean();

    // Exclude current user from the list
    if (excludeUserId) {
      return users.filter(u => u._id.toString() !== excludeUserId.toString());
    }
    return users;
  }

  // ============================================
  // QUOTATION CART METHODS (Customer-first flow)
  // ============================================

  /**
   * Create a quotation cart with customer pre-assigned
   * @param {String} userId - User ID creating the quotation
   * @param {String} customerId - Customer ID to assign
   * @returns {Object} Created quotation (draft inquiry with customer)
   */
  async createQuotationCart(userId, customerId) {
    const customer = await Customer.findById(customerId).populate('accountManager', 'name email phone role');

    if (!customer) {
      throw new Error('Customer not found');
    }

    const priceListCategory = customer.priceListCategory || 'T1';

    // Create a new inquiry with customer already assigned
    const inquiry = await Inquiry.create({
      customerId: customerId,
      customerDetails: {
        name: customer.name || customer.firmName || 'Unknown',
        firmName: customer.firmName || customer.name || 'Unknown',
        mobile: customer.mobile,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        gstin: customer.gstin,
        priceListCategory: priceListCategory
      },
      // Auto-assign to customer's account manager if exists
      assignedTo: customer.accountManager && customer.accountManager.length > 0
        ? customer.accountManager[0]._id
        : undefined,
      status: 'draft',
      items: [],
      subtotal: 0,
      discountTotal: 0,
      gstTotal: 0,
      grandTotal: 0,
      createdBy: userId
    });

    // Populate the created inquiry
    const populatedInquiry = await Inquiry.findById(inquiry._id)
      .populate('customerId', 'name firmName mobile email priceListCategory accountManager')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email');

    return populatedInquiry;
  }

  /**
   * Add product to quotation cart (with customer-specific pricing)
   * @param {String} inquiryId - Quotation inquiry ID
   * @param {String} productId - Product ID to add
   * @param {Number} qty - Quantity
   * @param {Number} discount - Discount percentage
   * @returns {Object} Updated quotation
   */
  async addProductToQuotationCart(inquiryId, productId, qty = 1, discount = 0) {
    const inquiry = await Inquiry.findById(inquiryId).populate('customerId');

    if (!inquiry) {
      throw new Error('Quotation not found');
    }

    if (!inquiry.customerId) {
      throw new Error('No customer assigned to this quotation');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Get customer's price list category for correct pricing
    const priceListCategory = inquiry.customerId.priceListCategory ||
      inquiry.customerDetails?.priceListCategory || 'T1';

    // Get the correct price based on customer's price list
    const sellingPrice = this.getPriceForCustomer(product, priceListCategory);

    // Check if product already exists in quotation
    const existingItemIndex = inquiry.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update existing item
      inquiry.items[existingItemIndex].qty += qty;
      inquiry.items[existingItemIndex].discount = discount;
      inquiry.items[existingItemIndex].price = sellingPrice;

      // Recalculate item total
      const item = inquiry.items[existingItemIndex];
      const itemSubtotal = item.price * item.qty;
      const itemDiscount = itemSubtotal * (item.discount / 100);
      const itemTaxableValue = itemSubtotal - itemDiscount;
      const itemTotal = itemTaxableValue * (1 + item.gstRate / 100);
      inquiry.items[existingItemIndex].total = Math.round(itemTotal * 100) / 100;
    } else {
      // Calculate item total
      const itemSubtotal = sellingPrice * qty;
      const itemDiscount = itemSubtotal * (discount / 100);
      const itemTaxableValue = itemSubtotal - itemDiscount;
      const itemTotal = itemTaxableValue * (1 + product.gstRate / 100);

      // Add new item with customer-specific price
      inquiry.items.push({
        productId: product._id,
        productName: product.name,
        brand: product.brand,
        category: product.category,
        subcategory: product.subcategory,
        partNumber: product.partNumber,
        series: product.series,
        boxSize: product.boxSize,
        stock: product.stock,
        shortDescription: product.shortDescription,
        imgurl: product.imgurl || product.imageUrl,
        price: sellingPrice,
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
    return Inquiry.findById(inquiry._id)
      .populate('customerId', 'name firmName mobile email priceListCategory accountManager')
      .populate('assignedTo', 'name email role');
  }

  /**
   * Update product in quotation cart
   * @param {String} inquiryId - Quotation inquiry ID
   * @param {String} productId - Product ID to update
   * @param {Object} data - Update data (qty, discount)
   * @returns {Object} Updated quotation
   */
  async updateQuotationCartItem(inquiryId, productId, data) {
    const inquiry = await Inquiry.findById(inquiryId);

    if (!inquiry) {
      throw new Error('Quotation not found');
    }

    const itemIndex = inquiry.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      throw new Error('Product not found in quotation');
    }

    // Update item
    if (data.qty !== undefined) {
      inquiry.items[itemIndex].qty = data.qty;
    }
    if (data.discount !== undefined) {
      inquiry.items[itemIndex].discount = data.discount;
    }

    // Recalculate item total
    const item = inquiry.items[itemIndex];
    const itemSubtotal = item.price * item.qty;
    const itemDiscount = itemSubtotal * (item.discount / 100);
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
    return Inquiry.findById(inquiry._id)
      .populate('customerId', 'name firmName mobile email priceListCategory accountManager')
      .populate('assignedTo', 'name email role');
  }

  /**
   * Remove product from quotation cart
   * @param {String} inquiryId - Quotation inquiry ID
   * @param {String} productId - Product ID to remove
   * @returns {Object} Updated quotation
   */
  async removeQuotationCartItem(inquiryId, productId) {
    const inquiry = await Inquiry.findById(inquiryId);

    if (!inquiry) {
      throw new Error('Quotation not found');
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
    return Inquiry.findById(inquiry._id)
      .populate('customerId', 'name firmName mobile email priceListCategory accountManager')
      .populate('assignedTo', 'name email role');
  }

  /**
   * Submit quotation (finalize it)
   * @param {String} inquiryId - Quotation inquiry ID
   * @param {String} notes - Optional notes
   * @param {Object} contactPerson - Optional contact person details
   * @returns {Object} Finalized quotation
   */
  async submitQuotationCart(inquiryId, notes = '', contactPerson = null) {
    const inquiry = await Inquiry.findById(inquiryId);

    if (!inquiry) {
      throw new Error('Quotation not found');
    }

    if (!inquiry.customerId) {
      throw new Error('No customer assigned to this quotation');
    }

    if (inquiry.items.length === 0) {
      throw new Error('Quotation has no items');
    }

    // Store notes
    if (notes) {
      inquiry.notes = notes;
    }

    // Store contact person if provided
    if (contactPerson) {
      inquiry.contactPerson = {
        name: contactPerson.name || '',
        designation: contactPerson.designation || '',
        mobile: contactPerson.mobile || '',
        email: contactPerson.email || '',
        isPrimary: contactPerson.isPrimary || false,
        isWhatsApp: contactPerson.isWhatsApp !== false
      };
    }

    // Generate inquiry ID (only if not already set)
    if (!inquiry.inquiryId) {
      const inquiryCount = await Inquiry.countDocuments();
      inquiry.inquiryId = `INQ${String(inquiryCount + 1).padStart(6, '0')}`;
    }

    // Keep status as draft (consistent with existing submitCart behavior)
    inquiry.status = 'draft';

    await inquiry.save();

    return Inquiry.findById(inquiry._id)
      .populate('customerId', 'name firmName mobile email address city state gstin priceListCategory accountManager')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email role');
  }

  /**
   * Get quotation by ID (with full population)
   * @param {String} inquiryId - Quotation inquiry ID
   * @returns {Object} Quotation details
   */
  async getQuotationById(inquiryId) {
    const inquiry = await Inquiry.findById(inquiryId)
      .populate('customerId', 'name firmName mobile email address city state gstin priceListCategory accountManager')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role');

    if (!inquiry) {
      throw new Error('Quotation not found');
    }

    return inquiry;
  }
}

export default new InquiryService();