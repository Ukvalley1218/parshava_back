import dashboardService from '../services/dashboard.service.js';

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private
export const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getDashboardSummary();

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's sales
// @route   GET /api/dashboard/sales
// @access  Private
export const getTodaySales = async (req, res, next) => {
  try {
    const sales = await dashboardService.getTodaySales();

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get outstanding customers
// @route   GET /api/dashboard/outstanding
// @access  Private
export const getOutstandingCustomers = async (req, res, next) => {
  try {
    const customers = await dashboardService.getOutstandingCustomers();

    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overdue customers
// @route   GET /api/dashboard/overdue
// @access  Private
export const getOverdueCustomers = async (req, res, next) => {
  try {
    const customers = await dashboardService.getOverdueCustomers();

    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top customers
// @route   GET /api/dashboard/top-customers
// @access  Private
export const getTopCustomers = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const customers = await dashboardService.getTopCustomers(
      limit ? parseInt(limit) : 10
    );

    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    next(error);
  }
};