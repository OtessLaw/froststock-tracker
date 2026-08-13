const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockTransaction = require('../models/StockTransaction');

// POST /api/sales - Create sale with stock deduction
// Note: Uses sequential operations (compatible with standalone MongoDB and Atlas free tier)
const createSale = async (req, res, next) => {
  try {
    const { items, paymentMethod, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please add at least one product to the sale.' });
    }

    // === STEP 1: Validate ALL products and stock BEFORE making any changes ===
    const saleItems = [];
    let subtotal = 0;
    let totalCost = 0;

    for (const item of items) {
      if (!item.productId || !item.quantity || Number(item.quantity) <= 0) {
        return res.status(400).json({ success: false, message: 'Each item must have a valid product and quantity greater than zero.' });
      }

      const product = await Product.findById(item.productId).populate('category', 'name');
      if (!product || !product.active) {
        return res.status(404).json({ success: false, message: `Product not found.` });
      }

      if (product.currentStock < Number(item.quantity)) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}. Available: ${product.currentStock}${product.unit}, Requested: ${item.quantity}${product.unit}`,
        });
      }

      const itemSubtotal = Number((Number(item.quantity) * product.sellingPrice).toFixed(2));
      const itemCost = Number((Number(item.quantity) * product.buyingPrice).toFixed(2));
      const itemProfit = Number((itemSubtotal - itemCost).toFixed(2));

      saleItems.push({
        product: product._id,
        productName: product.name,
        category: product.category ? product.category.name : '',
        quantity: Number(item.quantity),
        unit: product.unit,
        sellingPrice: product.sellingPrice,
        costPrice: product.buyingPrice,
        subtotal: itemSubtotal,
        profit: itemProfit,
        // Keep reference for stock update
        _productRef: product,
      });

      subtotal += itemSubtotal;
      totalCost += itemCost;
    }

    const total = Number(subtotal.toFixed(2));
    const grossProfit = Number((total - totalCost).toFixed(2));

    // === STEP 2: Create the sale ===
    const saleData = saleItems.map(({ _productRef, ...item }) => item);

    const sale = await Sale.create({
      items: saleData,
      subtotal: total,
      total,
      totalCost: Number(totalCost.toFixed(2)),
      grossProfit,
      paymentMethod: paymentMethod || 'cash',
      notes: notes || '',
      user: req.user._id,
      userName: req.user.name,
    });

    // === STEP 3: Deduct stock and create transaction records ===
    const stockUpdateErrors = [];
    for (const item of saleItems) {
      try {
        const product = item._productRef;
        const previousStock = product.currentStock;
        const newStock = Number((previousStock - item.quantity).toFixed(4));

        await Product.findByIdAndUpdate(item.product, { currentStock: newStock });

        // Trigger SMS if stock drops to or below minimum threshold
        if (newStock <= (product.minimumStock ?? 5)) {
          const { triggerLowStockSMS } = require('../services/smsService');
          triggerLowStockSMS(product, newStock).catch((e) => console.error('SMS alert error:', e.message));
        }

        await StockTransaction.create({
          product: item.product,
          productName: item.productName,
          type: 'sale',
          quantity: item.quantity,
          unit: item.unit,
          previousStock,
          newStock,
          buyingPrice: item.costPrice,
          reason: `Sale #${sale.saleNumber}`,
          reference: sale._id.toString(),
          user: req.user._id,
          userName: req.user.name,
        });
      } catch (stockErr) {
        stockUpdateErrors.push(`Failed to update stock for ${item.productName}`);
      }
    }

    const populatedSale = await Sale.findById(sale._id);
    res.status(201).json({
      success: true,
      message: stockUpdateErrors.length > 0
        ? `Sale recorded but some stock updates failed: ${stockUpdateErrors.join(', ')}`
        : 'Sale recorded successfully!',
      data: populatedSale,
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/sales
const getSales = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, paymentMethod, startDate, endDate } = req.query;
    const query = {};

    if (search) query.saleNumber = { $regex: search, $options: 'i' };
    if (paymentMethod) query.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const sales = await Sale.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Sale.countDocuments(query);
    res.status(200).json({ success: true, data: sales, total });
  } catch (error) { next(error); }
};

// GET /api/sales/:id
const getSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found.' });
    res.status(200).json({ success: true, data: sale });
  } catch (error) { next(error); }
};

module.exports = { createSale, getSales, getSale };
