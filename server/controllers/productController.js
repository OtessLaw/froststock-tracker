const Product = require('../models/Product');

// GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const { search, category, status, page = 1, limit = 50 } = req.query;

    const query = { active: true };

    if (category && category !== 'all') query.category = category;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('supplier', 'name phone')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    // Filter by status after populating (virtual field)
    let filtered = products;
    if (status === 'low_stock') filtered = products.filter(p => p.stockStatus === 'low_stock');
    else if (status === 'out_of_stock') filtered = products.filter(p => p.stockStatus === 'out_of_stock');
    else if (status === 'in_stock') filtered = products.filter(p => p.stockStatus === 'in_stock');

    res.status(200).json({ success: true, data: filtered, total });
  } catch (error) { next(error); }
};

// GET /api/products/:id
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('supplier', 'name phone location');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.status(200).json({ success: true, data: product });
  } catch (error) { next(error); }
};

// POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const { name, category, description, unit, buyingPrice, sellingPrice, currentStock, minimumStock, image, supplier } = req.body;

    if (!name || !category || !unit || buyingPrice === undefined || sellingPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields (name, category, unit, buying price, selling price).' });
    }

    if (Number(buyingPrice) < 0 || Number(sellingPrice) < 0) {
      return res.status(400).json({ success: false, message: 'Prices cannot be negative.' });
    }

    const product = await Product.create({
      name: name.trim(),
      category,
      description,
      unit,
      buyingPrice: Number(buyingPrice),
      sellingPrice: Number(sellingPrice),
      currentStock: Number(currentStock) || 0,
      minimumStock: Number(minimumStock) || 5,
      image,
      supplier: supplier || null,
    });

    const populated = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('supplier', 'name');

    res.status(201).json({ success: true, message: 'Product added successfully.', data: populated });
  } catch (error) { next(error); }
};

// PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const allowed = ['name', 'category', 'description', 'unit', 'buyingPrice', 'sellingPrice', 'minimumStock', 'image', 'supplier', 'active'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    await product.save();
    const populated = await Product.findById(product._id).populate('category', 'name').populate('supplier', 'name');
    res.status(200).json({ success: true, message: 'Product updated successfully.', data: populated });
  } catch (error) { next(error); }
};

// DELETE /api/products/:id  (soft delete)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.status(200).json({ success: true, message: 'Product removed.' });
  } catch (error) { next(error); }
};

// GET /api/products/low-stock
const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ active: true })
      .populate('category', 'name');

    const lowStock = products.filter(p => p.currentStock <= p.minimumStock);
    res.status(200).json({ success: true, data: lowStock });
  } catch (error) { next(error); }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getLowStockProducts };
