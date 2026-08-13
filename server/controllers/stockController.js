const Product = require('../models/Product');
const StockTransaction = require('../models/StockTransaction');
const Supplier = require('../models/Supplier');

// POST /api/stock/add
const addStock = async (req, res, next) => {
  try {
    const { productId, quantity, buyingPrice, supplierId, batchNumber, expiryDate, notes } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ success: false, message: 'Product and quantity are required.' });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than zero.' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.active) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let supplierName = null;
    if (supplierId) {
      const supplier = await Supplier.findById(supplierId);
      if (supplier) supplierName = supplier.name;
    }

    const previousStock = product.currentStock;
    const addedQty = Number(quantity);
    product.currentStock = previousStock + addedQty;

    // Update buying price if provided
    if (buyingPrice !== undefined && Number(buyingPrice) >= 0) {
      product.buyingPrice = Number(buyingPrice);
    }
    if (supplierId) product.supplier = supplierId;

    await product.save();

    // Record transaction
    await StockTransaction.create({
      product: product._id,
      productName: product.name,
      type: 'add',
      quantity: addedQty,
      unit: product.unit,
      previousStock,
      newStock: product.currentStock,
      buyingPrice: buyingPrice ? Number(buyingPrice) : product.buyingPrice,
      supplier: supplierId || null,
      supplierName,
      batchNumber: batchNumber || null,
      expiryDate: expiryDate || null,
      reason: notes || 'Stock added',
      user: req.user._id,
      userName: req.user.name,
    });

    const populated = await Product.findById(product._id).populate('category', 'name').populate('supplier', 'name');
    res.status(200).json({ success: true, message: `Stock added successfully. ${product.name}: ${previousStock}${product.unit} → ${product.currentStock}${product.unit}`, data: populated });
  } catch (error) { next(error); }
};

// POST /api/stock/adjust
const adjustStock = async (req, res, next) => {
  try {
    const { productId, newQuantity, reason } = req.body;

    if (!productId || newQuantity === undefined) {
      return res.status(400).json({ success: false, message: 'Product and new quantity are required.' });
    }

    if (Number(newQuantity) < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative.' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a reason for the adjustment.' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.active) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const previousStock = product.currentStock;
    const newStock = Number(newQuantity);
    const difference = newStock - previousStock;

    product.currentStock = newStock;
    await product.save();

    await StockTransaction.create({
      product: product._id,
      productName: product.name,
      type: 'adjust',
      quantity: Math.abs(difference),
      unit: product.unit,
      previousStock,
      newStock,
      reason: reason.trim(),
      user: req.user._id,
      userName: req.user.name,
    });

    const populated = await Product.findById(product._id).populate('category', 'name');
    res.status(200).json({ success: true, message: 'Stock adjusted successfully.', data: populated });
  } catch (error) { next(error); }
};

// GET /api/stock/history
const getStockHistory = async (req, res, next) => {
  try {
    const { productId, type, page = 1, limit = 30 } = req.query;
    const query = {};
    if (productId) query.product = productId;
    if (type) query.type = type;

    const history = await StockTransaction.find(query)
      .populate('product', 'name unit')
      .populate('supplier', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await StockTransaction.countDocuments(query);
    res.status(200).json({ success: true, data: history, total });
  } catch (error) { next(error); }
};

module.exports = { addStock, adjustStock, getStockHistory };
