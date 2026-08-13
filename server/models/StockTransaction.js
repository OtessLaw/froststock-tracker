const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['add', 'sale', 'adjust', 'initial'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    buyingPrice: {
      type: Number,
      default: 0,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    supplierName: {
      type: String,
      default: null,
    },
    batchNumber: {
      type: String,
      trim: true,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      default: null,
    },
    reference: {
      type: String,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

stockTransactionSchema.index({ product: 1, createdAt: -1 });
stockTransactionSchema.index({ type: 1 });

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
