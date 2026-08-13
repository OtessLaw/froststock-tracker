const express = require('express');
const router = express.Router();
const { addStock, adjustStock, getStockHistory } = require('../controllers/stockController');
const { protect, authorize } = require('../middleware/auth');

router.post('/add', protect, addStock);
router.post('/adjust', protect, authorize('admin'), adjustStock);
router.get('/history', protect, getStockHistory);

module.exports = router;
