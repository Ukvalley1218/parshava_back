import axios from 'axios';
import Customer from '../models/customer.model.js';
import Order from '../models/order.model.js';
import { createNotification } from './notification.service.js';

// Base URL for AccountGST API
const ACCOUNTGST_BASE_URL = process.env.ACCOUNTGST_BASE_URL || 'https://ultimate.accountgst.com/admin/api';

/**
 * Make request to AccountGST API
 * @param {String} endpoint - API endpoint
 * @param {Object} additionalPayload - Additional payload data
 * @returns {Object} API response data
 */
const makeAccountGSTRequest = async (endpoint, additionalPayload = {}) => {
  const payload = {
    connectingkey: process.env.ACCOUNTGST_KEY,
    companycode: process.env.ACCOUNTGST_COMPANY,
    ...additionalPayload
  };

  const response = await axios.post(
    `${ACCOUNTGST_BASE_URL}/${endpoint}`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.data || response.data.status !== 'success') {
    throw new Error(`AccountGST API Error: ${response.data?.message || 'Unknown error'}`);
  }

  return response.data;
};

/**
 * Create customer in AccountGST using base64 encoded data
 * @param {Object} customerData - Customer data
 * @returns {Object} AccountGST response
 */
const createCustomerInAccountGST = async (customerData) => {
  // Get the base URL for the link field (use the same server we're calling)
  const baseUrl = process.env.ACCOUNTGST_BASE_URL || 'https://ultimate.accountgst.com/admin/api';
  const linkUrl = baseUrl.replace('/admin/api', '');

  // Prepare customer data for AccountGST
  // Only include fields that are required or have valid values
  const customerDataForGST = {
    name: customerData.firmName || customerData.name || '',
    gstin: customerData.gstin || '',
    address: customerData.address || '',
    cityname: customerData.city || '',
    statename: customerData.state || '',
    pin: customerData.pincode || '',
    contact: customerData.name || '',
    mobile: customerData.mobile || '',
    email: customerData.email || '',
    alternatemobile: customerData.mobile2 || customerData.alternateMobile || '',
    openingbalance: '',
    openingtype: 'debit',
    salesmanid: '',
    stoplimit: '',
    alertlimit: '',
    creditlimitonbilldays: '',
    applogin: 0,
    turnoverdays: '',
    transporterid: '',
    excludefromtimelyreminder: 1,
    excludefrommonthlyreminder: 1
  };

  // Only add pricelistid if it exists and is not empty
  // Many AccountGST setups don't have pricelists configured
  if (customerData.priceListCategory && customerData.priceListCategory.trim()) {
    customerDataForGST.pricelistid = customerData.priceListCategory;
  }

  // Prepare the data structure for AccountGST (for base64 encoded format)
  // Note: customercreate.php uses 'connectid' (not 'connectingkey') - this is critical!
  const dataToEncode = {
    connectid: process.env.ACCOUNTGST_KEY,
    companycode: process.env.ACCOUNTGST_COMPANY,
    link: linkUrl,
    data: customerDataForGST
  };

  // Log the data being sent (without showing full key for security)
  console.log('AccountGST Customer Create - Data to encode:', {
    connectid: process.env.ACCOUNTGST_KEY ? `${process.env.ACCOUNTGST_KEY.substring(0, 20)}...` : 'NOT SET',
    companycode: process.env.ACCOUNTGST_COMPANY,
    link: linkUrl,
    customerData: customerDataForGST
  });

  // Encode the data to base64
  const jsonData = JSON.stringify(dataToEncode);
  const base64Data = Buffer.from(jsonData).toString('base64');

  console.log('AccountGST Customer Create - Base64 length:', base64Data.length);

  // Send as form-urlencoded with 'data' field
  const params = new URLSearchParams();
  params.append('data', base64Data);

  console.log('AccountGST Customer Create - URL:', `${ACCOUNTGST_BASE_URL}/customercreate.php`);

  try {
    const response = await axios.post(
      `${ACCOUNTGST_BASE_URL}/customercreate.php`,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('AccountGST Customer Create Response (urlencoded):', JSON.stringify(response.data, null, 2));

    // If the response indicates an error, try JSON format as fallback
    if (response.data && response.data.status === 'error') {
      console.log('Urlencoded format failed, trying JSON format...');

      // Try sending as JSON instead (using connectid, not connectingkey)
      const jsonPayload = {
        connectid: process.env.ACCOUNTGST_KEY,
        companycode: process.env.ACCOUNTGST_COMPANY,
        name: customerData.firmName || customerData.name || '',
        gstin: customerData.gstin || '',
        address: customerData.address || '',
        cityname: customerData.city || '',
        statename: customerData.state || '',
        pin: customerData.pincode || '',
        contact: customerData.name || '',
        mobile: customerData.mobile || '',
        email: customerData.email || '',
        alternatemobile: customerData.mobile2 || '',
        openingbalance: '',
        openingtype: 'debit',
        salesmanid: '',
        stoplimit: '',
        alertlimit: '',
        creditlimitonbilldays: '',
        applogin: 0,
        turnoverdays: '',
        transporterid: '',
        excludefromtimelyreminder: 1,
        excludefrommonthlyreminder: 1
      };

      // Only add pricelistid if valid
      if (customerData.priceListCategory && customerData.priceListCategory.trim()) {
        jsonPayload.pricelistid = customerData.priceListCategory;
      }

      const jsonResponse = await axios.post(
        `${ACCOUNTGST_BASE_URL}/customercreate.php`,
        jsonPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('AccountGST Customer Create Response (JSON):', JSON.stringify(jsonResponse.data, null, 2));
      return jsonResponse.data;
    }

    return response.data;
  } catch (error) {
    console.error('AccountGST API Error:', error.message);
    if (error.response) {
      console.error('AccountGST API Error Response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

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
      const response = await createCustomerInAccountGST(customer.toObject());

      // Step 3: Update MongoDB record with AccountGST response
      // Check for various response formats
      if (response && response.status === 'success') {
        // Success response - check for ID
        if (response.result?.refmasterconnectid) {
          customer.accountgstId = response.result.refmasterconnectid;
        } else if (response.result?.customerid) {
          customer.accountgstId = response.result.customerid;
        } else if (response.refmasterconnectid) {
          customer.accountgstId = response.refmasterconnectid;
        } else if (response.customerid) {
          customer.accountgstId = response.customerid;
        }
        customer.syncStatus = 'synced';
        customer.lastSyncedAt = new Date();
        customer.accountgstSyncError = undefined;
      } else if (response && response.status === 'error') {
        // Error response - AccountGST returns 'msg' property
        customer.syncStatus = 'failed';
        customer.accountgstSyncError = response.msg || response.message || response.error || 'API returned error status';
      } else if (response && response.result) {
        // Some APIs return result directly without status
        if (response.result.refmasterconnectid || response.result.customerid) {
          customer.accountgstId = response.result.refmasterconnectid || response.result.customerid;
          customer.syncStatus = 'synced';
          customer.lastSyncedAt = new Date();
        } else {
          customer.syncStatus = 'failed';
          customer.accountgstSyncError = 'No customer ID returned from AccountGST';
        }
      } else {
        // Unknown response format
        customer.syncStatus = 'failed';
        customer.accountgstSyncError = response?.message || response?.error || 'Unknown response format from AccountGST';
        console.error('Unknown AccountGST response format:', JSON.stringify(response));
      }
    } catch (error) {
      console.error('AccountGST API Error:', error.message);
      console.error('AccountGST API Error Stack:', error.stack);
      customer.syncStatus = 'failed';
      customer.accountgstSyncError = error.response?.data?.message || error.message || 'Network or API error';
    }

    await customer.save();

    // Create notification for new customer
    try {
      await createNotification({
        title: 'New Customer Added',
        message: `Customer ${customer.firmName || customer.name} has been created`,
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

    // Fetch customers
    const [customers, total] = await Promise.all([
      Customer.find(query)
        .select('name firmName mobile email city state address outstanding status contactPerson accountgstId syncStatus createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Customer.countDocuments(query)
    ]);

    // Get last order date for each customer
    if (customers.length > 0) {
      const customerIds = customers.map(c => c._id);

      // Aggregate to get the most recent order for each customer
      const lastOrders = await Order.aggregate([
        {
          $match: {
            customerId: { $in: customerIds }
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: '$customerId',
            lastOrder: { $first: '$createdAt' }
          }
        }
      ]);

      // Create a map of customerId to lastOrder
      const lastOrderMap = new Map();
      lastOrders.forEach(lo => {
        lastOrderMap.set(lo._id.toString(), lo.lastOrder);
      });

      // Add lastOrder to each customer
      customers.forEach(customer => {
        const lastOrderDate = lastOrderMap.get(customer._id.toString());
        if (lastOrderDate) {
          customer.lastOrder = new Date(lastOrderDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        } else {
          customer.lastOrder = null;
        }
      });
    }

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
      const response = await createCustomerInAccountGST(customer.toObject());

      if (response && response.status === 'success' && response.result?.refmasterconnectid) {
        customer.accountgstId = response.result.refmasterconnectid;
        customer.syncStatus = 'synced';
        customer.accountgstSyncError = undefined;
        customer.lastSyncedAt = new Date();
      } else if (response && response.status === 'success') {
        customer.syncStatus = 'synced';
        customer.lastSyncedAt = new Date();
      } else {
        customer.syncStatus = 'failed';
        customer.accountgstSyncError = response?.message || 'Unknown error from AccountGST';
      }
    } catch (error) {
      console.error('AccountGST API Error:', error.message);
      customer.syncStatus = 'failed';
      customer.accountgstSyncError = error.message;
    }

    await customer.save();
    return customer;
  }

  /**
   * Add a contact person to customer
   * @param {String} customerId - Customer ID
   * @param {Object} contactData - Contact person data
   * @returns {Object} Updated customer
   */
  async addContactPerson(customerId, contactData) {
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // If this is marked as primary, unmark other contacts as primary
    if (contactData.isPrimary) {
      customer.contactPersons.forEach(contact => {
        contact.isPrimary = false;
      });
    }

    // Add the new contact person
    customer.contactPersons.push(contactData);

    // Update legacy contactPerson field for backward compatibility
    if (contactData.isPrimary || customer.contactPersons.length === 1) {
      customer.contactPerson = contactData.name;
      customer.mobile = customer.mobile || contactData.mobile;
    }

    await customer.save();
    return customer.toObject();
  }

  /**
   * Update a contact person
   * @param {String} customerId - Customer ID
   * @param {String} contactId - Contact person ID
   * @param {Object} updateData - Updated contact data
   * @returns {Object} Updated customer
   */
  async updateContactPerson(customerId, contactId, updateData) {
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    const contactIndex = customer.contactPersons.findIndex(
      contact => contact._id.toString() === contactId
    );

    if (contactIndex === -1) {
      throw new Error('Contact person not found');
    }

    // If this is marked as primary, unmark other contacts
    if (updateData.isPrimary) {
      customer.contactPersons.forEach((contact, index) => {
        if (index !== contactIndex) {
          contact.isPrimary = false;
        }
      });
    }

    // Update the contact person
    Object.keys(updateData).forEach(key => {
      customer.contactPersons[contactIndex][key] = updateData[key];
    });

    // Update legacy field if primary contact changed
    if (updateData.isPrimary) {
      customer.contactPerson = customer.contactPersons[contactIndex].name;
    }

    await customer.save();
    return customer.toObject();
  }

  /**
   * Delete a contact person from customer
   * @param {String} customerId - Customer ID
   * @param {String} contactId - Contact person ID
   * @returns {Object} Updated customer
   */
  async deleteContactPerson(customerId, contactId) {
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    const contactIndex = customer.contactPersons.findIndex(
      contact => contact._id.toString() === contactId
    );

    if (contactIndex === -1) {
      throw new Error('Contact person not found');
    }

    // Remove the contact person
    customer.contactPersons.splice(contactIndex, 1);

    // Update legacy field if needed
    const primaryContact = customer.contactPersons.find(c => c.isPrimary);
    if (primaryContact) {
      customer.contactPerson = primaryContact.name;
    } else if (customer.contactPersons.length > 0) {
      customer.contactPerson = customer.contactPersons[0].name;
    } else {
      customer.contactPerson = '';
    }

    await customer.save();
    return customer.toObject();
  }
}

export default new CustomerService();