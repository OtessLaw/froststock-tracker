const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: { type: String, required: true },
  category: { type: String, default: '' },
  quantity: { type: Number, required: true, min: [0.001, 'Quantity must be greater than 0'] },
  unit: { type: String, required: true },
  sellingPrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  profit: { type: Number, required: true },
});

const saleSchema = new mongoose.Schema(
  {
    saleNumber: {
      type: String,
      unique: true,
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: 'Sale must have at least one item',
      },
    },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    grossProfit: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'mobile_money', 'bank', 'other'],
      default: 'cash',
    },
    notes: { type: String, trim: true, default: '' },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: { type: String, required: true },
  },
  { timestamps: true }
);

// Auto-generate sale number before saving
saleSchema.pre('save', async function (next) {
  if (!this.saleNumber) {
    const count = await mongoose.model('Sale').countDocuments();
    this.saleNumber = `FS${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

saleSchema.index({ createdAt: -1 });
saleSchema.index({ paymentMethod: 1 });

module.exports = mongoose.model('Sale', saleSchema);
