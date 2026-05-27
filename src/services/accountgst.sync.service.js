import axios from 'axios';
import Customer from '../models/customer.model.js';
import Product from '../models/product.model.js';
import Sale from '../models/sale.model.js';



// Base URL for AccountGST API
const ACCOUNTGST_BASE_URL = process.env.ACCOUNTGST_BASE_URL || 'https://ultimate.accountgst.com/admin/api';

/**
 * Make request to AccountGST API
 * @param {String} endpoint - API endpoint
 * @param {Object} additionalPayload - Additional payload data
 * @returns {Object} API response data
 */


/**
 * Make request to AccountGST API
 * Different endpoints use different field names for authentication:
 * - customercreate.php uses 'connectid'
 * - refmasterapi.php, productmasterapi.php use 'connectingkey'
 * @param {String} endpoint - API endpoint
 * @param {Object} additionalPayload - Additional payload data
 * @returns {Object} API response data
 */
const makeAccountGSTRequest = async (endpoint, additionalPayload = {}) => {
  // Use 'connectingkey' for most API endpoints (refmasterapi, productmasterapi, etc.)
  // Note: customercreate.php uses 'connectid' instead - handled separately in customer.service.js
  const payload = {
    connectingkey: process.env.ACCOUNTGST_KEY,
    companycode: process.env.ACCOUNTGST_COMPANY,
    ...additionalPayload
  };

  console.log(`AccountGST Request: ${endpoint}`, JSON.stringify({
    connectingkey: process.env.ACCOUNTGST_KEY ? `${process.env.ACCOUNTGST_KEY.substring(0, 20)}...` : 'NOT SET',
    companycode: process.env.ACCOUNTGST_COMPANY,
    ...additionalPayload
  }));

  try {
    const response = await axios.post(
      `${ACCOUNTGST_BASE_URL}/${endpoint}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    console.log(`AccountGST Response (${endpoint}):`, JSON.stringify(response.data, null, 2));

    if (!response.data || response.data.status !== "success") {
      console.error('AccountGST API returned non-success:', JSON.stringify(response.data, null, 2));
      throw new Error(`AccountGST API Error: ${response.data?.message || response.data?.msg || response.data?.error || "Unknown error"}`);
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('AccountGST API Error Response:', JSON.stringify(error.response.data, null, 2));
      throw new Error(`AccountGST API Error: ${error.response.data?.message || error.response.data?.msg || error.response.data?.error || error.message}`);
    }
    throw error;
  }
};

class AccountGSTSyncService {
  /**
   * Sync customers from AccountGST
   * @returns {Object} Sync result with count
   */
  async syncCustomers() {
    const response = await makeAccountGSTRequest('refmasterapi.php', {
      newlycreated: '0'
    });

    if (!response.result) {
  throw new Error('Invalid response from AccountGST product API');
}

const items = response.result;
    const syncTime = new Date();
    let syncedCount = 0;
    let failedCount = 0;

    for (const item of items) {
  try {

    await Customer.findOneAndUpdate(
      { accountgstId: item.refmasterconnectid },
      {
        name: item.name || "Unknown",
        code: item.code || "",
        mobile: item.mobile || "",
        alternateMobile: item.alternatemobile || "",
        email: item.email || "",
        address: item.address || "",
        city: item.cityname || "",
        state: item.statename || "",
        pincode: item.pin || "",
        gstin: item.gstin || "",
        refType: item.refmastertype || "",
        status: item.refmasterstatus || "",
        accountgstId: item.refmasterconnectid,
        syncStatus: "synced",
        imgurl:"https://img.freepik.com/free-photo/modern-stationary-collection-arrangement_23-2149309643.jpg?semt=ais_rp_progressive&w=740&q=80",
        lastSyncedAt: syncTime
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    syncedCount++;

  } catch (error) {

    console.error(
      `Failed to sync customer ${item.refmasterconnectid}:`,
      error.message
    );

    failedCount++;
  }
}

    return {
      total: items.length,
      synced: syncedCount,
      failed: failedCount,
      syncedAt: syncTime
    };
  }

  /**
   * Sync products from AccountGST
   * @returns {Object} Sync result with count
   */
  async syncProducts() {
    const response = await makeAccountGSTRequest('productmasterapi.php', {
      newlycreated: '0'
    });

    if (!response.result) {
      throw new Error('Invalid response from AccountGST product API');
    }

    const items = response.result;
    const syncTime = new Date();
    let syncedCount = 0;
    let failedCount = 0;

    for (const item of items) {
      try {
  await Product.findOneAndUpdate(
  { accountgstProductId: item.productconnectid },
  {
     name: item.productname?.replace(/\\'/g, "'") || "",

          partNumber: item.partnumber || "",

          brand: item.brandname || "",

          category: item.categoryname || "",

          productType: item.producttype || "",

          ledgerAccount: item.ledgeraccount || "",

          mrp: parseFloat(item.mrp || 0),

          mop: parseFloat(item.mop || 0),

          gstRate: parseFloat(item.gst || 0),

          hsn: item.hsnsac || "",

          unit: item.unit || "",

          stock: parseFloat(item.stock || 0),

          accountgstProductId: item.productconnectid,

          syncStatus: "synced",

          lastSyncedAt: syncTime
  },
  {
    upsert: true,
    new: true,
    runValidators: true
  }
);
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync product ${item.productconnectid}:`, error.message);
        failedCount++;
      }
    }

    return {
      total: items.length,
      synced: syncedCount,
      failed: failedCount,
      syncedAt: syncTime
    };
  }

  /**
   * Sync sales from AccountGST
   * @returns {Object} Sync result with count
   */
 async syncSales() {

  const response = await makeAccountGSTRequest("salerptapi.php", {
    newlycreated: "0",
    fromdate: "01-01-2020",
    todate: "31-12-2030",
    refmasterconnectid: "",
    paidstatus: ""
  });

  if (!response.result) {
    throw new Error("Invalid response from AccountGST sales API");
  }

  const items = response.result;
  const syncTime = new Date();

  let syncedCount = 0;
  let failedCount = 0;

  // preload customers
  const customers = await Customer.find().lean();
  const customerMap = new Map(
    customers.map(c => [c.accountgstId, c._id])
  );

  for (const item of items) {

    try {

      const invoiceDate = item.invoicedate
        ? new Date(item.invoicedate)
        : new Date();

      const customerId = customerMap.get(item.refmasterconnectid);

      await Sale.findOneAndUpdate(
        { invoiceNo: item.invoicenum },
        {
          invoiceNo: item.invoicenum,
          invoiceDate,
          customerName: item.buyerfirm || "",
          customerId,

          taxableValue: parseFloat(item.invoicetaxableamt || 0),

          gstValue:
            parseFloat(item.invoicecgstamt || 0) +
            parseFloat(item.invoicesgstamt || 0) +
            parseFloat(item.invoiceigstamt || 0),

          totalValue: parseFloat(item.invoicetotal || 0),

          paidStatus: (item.paidstatus || "").toLowerCase(),

          receivedAmount: parseFloat(item.receiveamt || 0),
          pendingAmount: parseFloat(item.pendingamt || 0),

          accountgstInvoiceId: item.billconnectid,

          syncStatus: "synced",
          lastSyncedAt: syncTime
        },
        { upsert: true }
      );

      syncedCount++;

    } catch (error) {

      console.error(`Failed to sync sale ${item.invoicenum}:`, error.message);
      failedCount++;

    }
  }

  return {
    total: items.length,
    synced: syncedCount,
    failed: failedCount,
    syncedAt: syncTime
  };
}

  /**
   * Sync all data (customers, products, sales)
   * @returns {Object} Complete sync results
   */
  async syncAllData() {
    const syncTime = new Date();

    const [customersResult, productsResult, salesResult] = await Promise.all([
      this.syncCustomers(),
      this.syncProducts(),
      this.syncSales()
    ]);

    return {
      customers: customersResult,
      products: productsResult,
      sales: salesResult,
      syncedAt: syncTime
    };
  }
}

export default new AccountGSTSyncService();