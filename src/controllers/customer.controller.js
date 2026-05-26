import customerService from '../services/customer.service.js';

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res, next) => {
  try {
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

    const result = await customerService.getCustomers({
      page: page || 1,
      limit: limit || 10,
      search: search || '',
      city: city || '',
      cities: cities || ''
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