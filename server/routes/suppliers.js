const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getSuppliers);
router.post('/', protect, authorize('admin'), createSupplier);
router.put('/:id', protect, authorize('admin'), updateSupplier);
router.delete('/:id', protect, authorize('admin'), deleteSupplier);

module.exports = router;
