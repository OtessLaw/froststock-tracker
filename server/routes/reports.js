const express = require('express');
const router = express.Router();
const { getDashboard, getSalesReport, getInventoryReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboard);
router.get('/sales', protect, getSalesReport);
router.get('/inventory', protect, getInventoryReport);

module.exports = router;
