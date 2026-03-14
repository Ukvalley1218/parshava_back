import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
imgurl:{
    type: String,
    trim: true
},
  partNumber: {
    type: String,
    trim: true,
    maxlength: 50
  },

  brand: {
    type: String,
    trim: true,
    maxlength: 100
  },

  category: {
    type: String,
    trim: true,
    maxlength: 100
  },

  productType: {
    type: String,
    trim: true
  },

  ledgerAccount: {
    type: String,
    trim: true
  },

  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  mrp: {
    type: Number,
    min: 0
  },

  mop: {
    type: Number,
    min: 0
  },

  nlc: {
    type: Number,
    min: 0
  },

  gstRate: {
    type: Number,
    min: 0,
    max: 100
  },

  hsn: {
    type: String,
    trim: true,
    maxlength: 10
  },

  unit: {
    type: String,
    trim: true,
    maxlength: 20
  },

  stock: {
    type: Number,
    default: 0
  },

  accountgstProductId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },

  syncStatus: {
    type: String,
    enum: ['pending', 'synced', 'failed'],
    default: 'pending'
  },

  lastSyncedAt: {
    type: Date
  }

}, { timestamps: true });

// Indexes for search and filter functionality
productSchema.index({ name: 'text' });
productSchema.index({ brand: 1 });
productSchema.index({ category: 1 });
productSchema.index({ partNumber: 1 });
productSchema.index({ accountgstProductId: 1 });

export default mongoose.model('Product', productSchema);