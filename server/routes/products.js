const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getLowStockProducts } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.get('/low-stock', protect, getLowStockProducts);
router.get('/', protect, getProducts);
router.get('/:id', protect, getProduct);
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

// Test SMS Alert endpoint (Admin only)
router.post('/test-sms', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { phone, message } = req.body;
    const { sendSMS } = require('../services/smsService');
    const result = await sendSMS({
      to: phone || process.env.OWNER_PHONE_NUMBER,
      message: message || '🧊 FROSTSTOCK ALERT TEST: This is a test SMS alert for low stock! Everything is working cleanly.',
    });
    res.status(200).json({ success: true, message: 'SMS request processed!', data: result });
  } catch (error) { next(error); }
});

module.exports = router;
