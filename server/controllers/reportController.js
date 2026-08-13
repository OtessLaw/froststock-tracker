const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const StockTransaction = require('../models/StockTransaction');

// Helper: get date range for today
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// GET /api/reports/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const { start, end } = getTodayRange();

    // Today's sales
    const todaySales = await Sale.find({ createdAt: { $gte: start, $lte: end } });
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const todayProfit = todaySales.reduce((sum, s) => sum + s.grossProfit, 0);
    const todayItemsSold = todaySales.reduce((sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0), 0);

    // Today's expenses
    const todayExpenses = await Expense.find({ date: { $gte: start, $lte: end } });
    const todayExpenseTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Low stock
    const products = await Product.find({ active: true }).populate('category', 'name');
    const lowStockItems = products.filter(p => p.currentStock <= p.minimumStock && p.currentStock >= 0);
    const outOfStockItems = products.filter(p => p.currentStock <= 0);

    // Recent sales (last 5)
    const recentSales = await Sale.find().sort({ createdAt: -1 }).limit(5);

    // Sales last 7 days for chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const salesChart = await Sale.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          profit: { $sum: '$grossProfit' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top 5 selling products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topProducts = await Sale.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          totalProfit: { $sum: '$items.profit' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        today: {
          revenue: todayRevenue,
          profit: todayProfit,
          netProfit: todayProfit - todayExpenseTotal,
          itemsSold: Math.round(todayItemsSold * 100) / 100,
          salesCount: todaySales.length,
          expenses: todayExpenseTotal,
        },
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        lowStockItems: lowStockItems.slice(0, 6).map(p => ({
          id: p._id, name: p.name, currentStock: p.currentStock,
          minimumStock: p.minimumStock, unit: p.unit, category: p.category?.name,
        })),
        recentSales,
        salesChart,
        topProducts,
      },
    });
  } catch (error) { next(error); }
};

// GET /api/reports/sales?period=today|week|month|custom&startDate=&endDate=
const getSalesReport = async (req, res, next) => {
  try {
    const { period = 'today', startDate, endDate } = req.query;
    let start, end;

    if (period === 'today') {
      ({ start, end } = getTodayRange());
    } else if (period === 'week') {
      start = new Date(); start.setDate(start.getDate() - 6); start.setHours(0,0,0,0);
      end = new Date(); end.setHours(23,59,59,999);
    } else if (period === 'month') {
      start = new Date(); start.setDate(start.getDate() - 29); start.setHours(0,0,0,0);
      end = new Date(); end.setHours(23,59,59,999);
    } else if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate); start.setHours(0,0,0,0);
      end = new Date(endDate); end.setHours(23,59,59,999);
    } else {
      ({ start, end } = getTodayRange());
    }

    const sales = await Sale.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 });
    const expenses = await Expense.find({ date: { $gte: start, $lte: end } });

    const revenue = sales.reduce((sum, s) => sum + s.total, 0);
    const cost = sales.reduce((sum, s) => sum + s.totalCost, 0);
    const grossProfit = sales.reduce((sum, s) => sum + s.grossProfit, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    // Daily breakdown for chart
    const dailyChart = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' }, profit: { $sum: '$grossProfit' }, count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    // Top products in period
    const topProducts = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.product', productName: { $first: '$items.productName' },
        totalQuantity: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.subtotal' },
        totalProfit: { $sum: '$items.profit' },
      }},
      { $sort: { totalRevenue: -1 } }, { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: { revenue, cost, grossProfit, totalExpenses, netProfit, salesCount: sales.length },
        dailyChart, topProducts, sales,
      },
    });
  } catch (error) { next(error); }
};

// GET /api/reports/inventory
const getInventoryReport = async (req, res, next) => {
  try {
    const products = await Product.find({ active: true }).populate('category', 'name');

    let totalCostValue = 0;
    let totalSellingValue = 0;

    const inventory = products.map(p => {
      const costValue = p.currentStock * p.buyingPrice;
      const sellingValue = p.currentStock * p.sellingPrice;
      totalCostValue += costValue;
      totalSellingValue += sellingValue;
      return {
        id: p._id, name: p.name, category: p.category?.name,
        currentStock: p.currentStock, unit: p.unit,
        buyingPrice: p.buyingPrice, sellingPrice: p.sellingPrice,
        costValue, sellingValue, stockStatus: p.stockStatus,
        minimumStock: p.minimumStock,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        inventory, totalCostValue, totalSellingValue,
        totalProducts: products.length,
        lowStockCount: products.filter(p => p.stockStatus === 'low_stock').length,
        outOfStockCount: products.filter(p => p.stockStatus === 'out_of_stock').length,
      },
    });
  } catch (error) { next(error); }
};

module.exports = { getDashboard, getSalesReport, getInventoryReport };
