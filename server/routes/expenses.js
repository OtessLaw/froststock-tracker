const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getExpenses);
router.post('/', protect, createExpense);
router.put('/:id', protect, authorize('admin'), updateExpense);
router.delete('/:id', protect, authorize('admin'), deleteExpense);

module.exports = router;
