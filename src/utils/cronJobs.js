import cron from 'node-cron';
import accountGSTSyncService from '../services/accountgst.sync.service.js';

/**
 * Start all cron jobs for automatic syncing
 */
const startCronJobs = () => {
  // Customer sync - runs every 6 hours
  
  cron.schedule('0 */6 * * *', async () => {
    try {
      console.log('Starting customer sync...');
      await accountGSTSyncService.syncCustomers();
      console.log('Customer sync completed');
    } catch (error) {
      console.log('Sync job failed');
    }
  });

  // Product sync - runs every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    try {
      console.log('Starting product sync...');
      await accountGSTSyncService.syncProducts();
      console.log('Product sync completed');
    } catch (error) {
      console.log('Sync job failed');
    }
  });

  // Sales sync - runs every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      console.log('Starting sales sync...');
      await accountGSTSyncService.syncSales();
      console.log('Sales sync completed');
    } catch (error) {
      console.log('Sync job failed');
    }
  });

  console.log('Cron jobs initialized');
};

export { startCronJobs };