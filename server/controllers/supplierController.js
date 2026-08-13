const Supplier = require('../models/Supplier');

const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ active: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) { next(error); }
};

const createSupplier = async (req, res, next) => {
  try {
    const { name, phone, location, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Supplier name is required.' });
    const supplier = await Supplier.create({ name: name.trim(), phone, location, notes });
    res.status(201).json({ success: true, message: 'Supplier added.', data: supplier });
  } catch (error) { next(error); }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found.' });
    res.status(200).json({ success: true, message: 'Supplier updated.', data: supplier });
  } catch (error) { next(error); }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found.' });
    res.status(200).json({ success: true, message: 'Supplier removed.' });
  } catch (error) { next(error); }
};

module.exports = { getSuppliers, createSupplier, updateSupplier, deleteSupplier };
