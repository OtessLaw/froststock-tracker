const Category = require('../models/Category');

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ active: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) { next(error); }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });
    const category = await Category.create({ name: name.trim(), description });
    res.status(201).json({ success: true, message: 'Category created successfully.', data: category });
  } catch (error) { next(error); }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.status(200).json({ success: true, message: 'Category updated.', data: category });
  } catch (error) { next(error); }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.status(200).json({ success: true, message: 'Category removed.' });
  } catch (error) { next(error); }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
