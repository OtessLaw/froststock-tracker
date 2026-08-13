const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['electricity', 'transport', 'ice', 'packaging', 'rent', 'repairs', 'salaries', 'other'],
      required: [true, 'Expense category is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'mobile_money', 'bank', 'other'],
      default: 'cash',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
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

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
