import accountGSTSyncService from '../services/accountgst.sync.service.js';

// @desc    Sync customers from AccountGST
// @route   POST /api/sync/customers
// @access  Private
export const syncCustomersController = async (req, res, next) => {
  try {
    const result = await accountGSTSyncService.syncCustomers();

    res.json({
      success: true,
      message: 'Customers synced successfully from AccountGST',
      data: {
        total: result.total,
        synced: result.synced,
        failed: result.failed,
        syncedAt: result.syncedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sync products from AccountGST
// @route   POST /api/sync/products
// @access  Private
export const syncProductsController = async (req, res, next) => {
  try {
    const result = await accountGSTSyncService.syncProducts();

    res.json({
      success: true,
      message: 'Products synced successfully from AccountGST',
      data: {
        total: result.total,
        synced: result.synced,
        failed: result.failed,
        syncedAt: result.syncedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sync sales from AccountGST
// @route   POST /api/sync/sales
// @access  Private
export const syncSalesController = async (req, res, next) => {
  try {
    const result = await accountGSTSyncService.syncSales();

    res.json({
      success: true,
      message: 'Sales synced successfully from AccountGST',
      data: {
        total: result.total,
        synced: result.synced,
        failed: result.failed,
        syncedAt: result.syncedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sync all data from AccountGST
// @route   POST /api/sync/all
// @access  Private
export const syncAllDataController = async (req, res, next) => {
  try {
    const result = await accountGSTSyncService.syncAllData();

    res.json({
      success: true,
      message: 'All data synced successfully from AccountGST',
      data: {
        customers: {
          total: result.customers.total,
          synced: result.customers.synced,
          failed: result.customers.failed
        },
        products: {
          total: result.products.total,
          synced: result.products.synced,
          failed: result.products.failed
        },
        sales: {
          total: result.sales.total,
          synced: result.sales.synced,
          failed: result.sales.failed
        },
        syncedAt: result.syncedAt
      }
    });
  } catch (error) {
    next(error);
  }
};