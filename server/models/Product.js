const mongoose = require('mongoose');

const UNITS = ['kg', 'g', 'piece', 'carton', 'bag', 'pack', 'box', 'other'];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    unit: {
      type: String,
      enum: UNITS,
      required: [true, 'Unit is required'],
      default: 'kg',
    },
    buyingPrice: {
      type: Number,
      required: [true, 'Buying price is required'],
      min: [0, 'Buying price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    currentStock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    minimumStock: {
      type: Number,
      default: 5,
      min: [0, 'Minimum stock cannot be negative'],
    },
    image: {
      type: String,
      default: null,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual: stock status
productSchema.virtual('stockStatus').get(function () {
  if (this.currentStock <= 0) return 'out_of_stock';
  if (this.currentStock <= this.minimumStock) return 'low_stock';
  return 'in_stock';
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ active: 1 });

module.exports = mongoose.model('Product', productSchema);
