import axios from 'axios';
import Customer from '../models/customer.model.js';
import { createNotification } from './notification.service.js';

class CustomerService {
  /**
   * Create a new customer in MongoDB and sync with AccountGST
   * @param {Object} data - Customer data
   * @param {String} userId - ID of the user creating the customer
   * @returns {Object} Created customer
   */
  async createCustomer(data, userId) {
    // Step 1: Save customer in MongoDB with syncStatus = pending
    const customer = await Customer.create({
      ...data,
      createdBy: userId,
      syncStatus: 'pending'
    });

    // Step 2: Call AccountGST API
    try {
      const response = await axios.post(
        'https://ultimate.accountgst.com/admin/api/customercreate.php',
        {
          connectingkey: process.env.ACCOUNTGST_KEY,
          companycode: process.env.ACCOUNTGST_COMPANY,
          customer: {
         name: customer.name,
    code: customer.code || "",
    mobile: customer.mobile || "",
    alternatemobile: customer.alternateMobile || "",
    email: customer.email || "",
    address: customer.address || "",
    gstin: customer.gstin || "",
    cityname: customer.city || "",
    statename: customer.state || "",
    pin: customer.pincode || ""
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Step 3: Update MongoDB record with AccountGST response
      if (response.data && response.data.success && response.data.data?.customer_id) {
        customer.accountgstId = response.data.data.customer_id;
        customer.syncStatus = 'synced';
        customer.lastSyncedAt = new Date();
      } else {
        customer.syncStatus = 'failed';
      }
    } catch (error) {
      console.error('AccountGST API Error:', error.message);
      customer.syncStatus = 'failed';
    }

    await customer.save();

    // Create notification for new customer
    try {
      await createNotification({
        title: 'New Customer Added',
        message: `Customer ${customer.name} has been created`,
        type: 'customer',
        userId: userId
      });
    } catch (error) {
      console.error('Notification failed:', error.message);
    }

    return customer;
  }

  /**
   * Get all customers with pagination, search, and filters
   * Optimized for performance with text search and lean queries
   * @param {Object} options - Query options
   * @returns {Object} Customers with pagination info
   */
  async getCustomers({ page = 1, limit = 10, search = '', city = '', cities = '' }) {
    const query = {};

    // Use text search for better performance (uses text index)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      // Use text search for fast full-text matching
      query.$text = { $search: searchTerm };
    }

    // Filter by single city (backward compatibility)
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    // Filter by multiple cities (comma-separated)
    if (cities) {
      const cityArray = cities.split(',').map(c => c.trim()).filter(c => c);
      if (cityArray.length > 0) {
        query.city = { $in: cityArray.map(c => new RegExp(`^${c}$`, 'i')) };
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Use lean() for faster queries (returns plain objects, not Mongoose documents)
    // Remove unnecessary populate() since name/email are not reference fields
    const [customers, total] = await Promise.all([
      Customer.find(query)
        .select('name mobile email city state address outstanding status contactPerson accountgstId syncStatus createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(), // Use lean for ~30% performance improvement
      Customer.countDocuments(query)
    ]);

    return {
      customers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    };
  }

  /**
   * Get unique cities list from customers
   * @returns {Array} List of unique cities
   */
  async getCities() {
    const cities = await Customer.distinct('city', { city: { $ne: null, $ne: '' } });
    return cities.filter(c => c).sort();
  }

  /**
   * Get customer by ID with additional details
   * @param {String} customerId - Customer ID
   * @returns {Object} Customer details with purchase info
   */
  async getCustomerById(customerId) {
    const customer = await Customer.findById(customerId).lean();

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Return customer with total purchase and outstanding
    // Note: In a real application, you would calculate total purchase from orders/invoices
    return {
      customer,
      totalPurchase: 0, // TODO: Calculate from orders/invoices collection
      outstanding: customer.outstanding
    };
  }

  /**
   * Update customer details
   * @param {String} customerId - Customer ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated customer
   */
  async updateCustomer(customerId, updateData) {
    const customer = await Customer.findByIdAndUpdate(
      customerId,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }

  /**
   * Delete customer by ID
   * @param {String} customerId - Customer ID
   * @returns {Boolean} Success status
   */
  async deleteCustomer(customerId) {
    const customer = await Customer.findByIdAndDelete(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    return true;
  }

  /**
   * Retry sync with AccountGST for failed customers
   * @param {String} customerId - Customer ID
   * @returns {Object} Updated customer
   */
  async retrySync(customerId) {
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    try {
      const response = await axios.post(
        'https://ultimate.accountgst.com/admin/api/customercreate.php',
        {
          connectingkey: process.env.ACCOUNTGST_KEY,
          companycode: process.env.ACCOUNTGST_COMPANY,
          customer: {
          name: customer.name,
    code: customer.code || "",
    mobile: customer.mobile || "",
    alternatemobile: customer.alternateMobile || "",
    email: customer.email || "",
    address: customer.address || "",
    gstin: customer.gstin || "",
    cityname: customer.city || "",
    statename: customer.state || "",
    pin: customer.pincode || ""
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success && response.data.data?.customer_id) {
        customer.accountgstId = response.data.data.customer_id;
        customer.syncStatus = 'synced';
        customer.lastSyncedAt = new Date();
      } else {
        customer.syncStatus = 'failed';
      }
    } catch (error) {
      console.error('AccountGST API Error:', error.message);
      customer.syncStatus = 'failed';
    }

    await customer.save();
    return customer;
  }
}

export default new CustomerService();