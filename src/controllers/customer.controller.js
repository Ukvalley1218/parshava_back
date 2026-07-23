import customerService from '../services/customer.service.js';
import Customer from '../models/customer.model.js';

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res, next) => {
  try {
    // Check for duplicate mobile numbers
    const { mobile, mobile2, mobile3, email } = req.body;
    const mobileNumbers = [mobile, mobile2, mobile3].filter(n => n && n.trim() !== '');
    const emailValue = email && email.trim() !== '' ? email.trim().toLowerCase() : null;

    if (mobileNumbers.length > 0) {
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

    const customer = await customerService.createCustomer(req.body, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all customers with pagination and filters
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res, next) => {
  try {
    const { page, limit, search, city, cities } = req.query;

    // If user is account_manager role, only show customers assigned to them
    let accountManagerFilter = null;
    if (req.user && req.user.role === 'account_manager') {
      accountManagerFilter = req.user._id;
    }

    const result = await customerService.getCustomers({
      page: page || 1,
      limit: limit || 10,
      search: search || '',
      city: city || '',
      cities: cities || '',
      accountManager: accountManagerFilter
    });

    res.json({
      success: true,
      data: result.customers,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unique cities list
// @route   GET /api/customers/cities
// @access  Private
export const getCities = async (req, res, next) => {
  try {
    const cities = await customerService.getCities();

    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = async (req, res, next) => {
  try {
    const result = await customerService.getCustomerById(req.params.id);

    // If user is account_manager, only allow access to customers assigned to them
    if (req.user && req.user.role === 'account_manager') {
      const managerIds = (result.customer.accountManager || []).map(m =>
        m._id ? m._id.toString() : m.toString()
      );
      if (!managerIds.includes(req.user._id.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: result.customer,
      totalPurchase: result.totalPurchase,
      outstanding: result.outstanding
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

// @desc    Update customer
// @route   PATCH /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res, next) => {
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

    const customer = await customerService.updateCustomer(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
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

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
export const deleteCustomer = async (req, res, next) => {
  try {
    await customerService.deleteCustomer(req.params.id);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
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

// @desc    Add contact person to customer
// @route   POST /api/customers/:id/contacts
// @access  Private
export const addContactPerson = async (req, res, next) => {
  try {
    const customer = await customerService.addContactPerson(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Contact person added successfully',
      data: customer
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

// @desc    Update contact person
// @route   PATCH /api/customers/:id/contacts/:contactId
// @access  Private
export const updateContactPerson = async (req, res, next) => {
  try {
    const customer = await customerService.updateContactPerson(req.params.id, req.params.contactId, req.body);

    res.json({
      success: true,
      message: 'Contact person updated successfully',
      data: customer
    });
  } catch (error) {
    if (error.message === 'Customer not found') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    if (error.message === 'Contact person not found') {
      return res.status(404).json({
        success: false,
        message: 'Contact person not found'
      });
    }
    next(error);
  }
};

// @desc    Delete contact person
// @route   DELETE /api/customers/:id/contacts/:contactId
// @access  Private
export const deleteContactPerson = async (req, res, next) => {
  try {
    const customer = await customerService.deleteContactPerson(req.params.id, req.params.contactId);

    res.json({
      success: true,
      message: 'Contact person deleted successfully',
      data: customer
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

// @desc    Retry AccountGST sync
// @route   POST /api/customers/:id/retry-sync
// @access  Private
export const retrySync = async (req, res, next) => {
  try {
    const customer = await customerService.retrySync(req.params.id);

    res.json({
      success: true,
      message: 'Sync retry completed',
      data: customer
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