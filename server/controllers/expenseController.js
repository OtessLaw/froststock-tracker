const Expense = require('../models/Expense');

const getExpenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, category, startDate, endDate } = req.query;
    const query = {};
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); query.date.$lte = e; }
    }
    const expenses = await Expense.find(query).sort({ date: -1 }).skip((page-1)*limit).limit(Number(limit));
    const total = await Expense.countDocuments(query);
    res.status(200).json({ success: true, data: expenses, total });
  } catch (error) { next(error); }
};

const createExpense = async (req, res, next) => {
  try {
    const { category, description, amount, paymentMethod, notes, date } = req.body;
    if (!category || !description || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Category, description, and amount are required.' });
    }
    if (Number(amount) < 0) return res.status(400).json({ success: false, message: 'Amount cannot be negative.' });
    const expense = await Expense.create({
      category, description: description.trim(), amount: Number(amount),
      paymentMethod: paymentMethod || 'cash', notes, date: date ? new Date(date) : new Date(),
      user: req.user._id, userName: req.user.name,
    });
    res.status(201).json({ success: true, message: 'Expense recorded.', data: expense });
  } catch (error) { next(error); }
};

const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });
    res.status(200).json({ success: true, message: 'Expense updated.', data: expense });
  } catch (error) { next(error); }
};

const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });
    res.status(200).json({ success: true, message: 'Expense deleted.' });
  } catch (error) { next(error); }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
