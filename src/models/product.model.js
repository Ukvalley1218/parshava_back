import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  imageUrl: {
    type: String,
    trim: true
  },

  partNumber: {
    type: String,
    trim: true,
    maxlength: 50
  },

  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Brand, Category, Subcategory - from Brand collection
  brand: {
    type: String,
    trim: true,
    maxlength: 100
  },

  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  },

  category: {
    type: String,
    trim: true,
    maxlength: 100
  },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId
  },

  subcategory: {
    type: String,
    trim: true,
    maxlength: 100
  },

  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId
  },

  // Basic Info
  unit: {
    type: String,
    trim: true,
    maxlength: 20
  },

  hsn: {
    type: String,
    trim: true,
    maxlength: 10
  },

  gstRate: {
    type: Number,
    min: 0,
    max: 100
  },

  // Pricing - Cost
  mrp: {
    type: Number,
    min: 0
  },

  mop: {
    type: Number,
    min: 0
  },

  purchasePrice: {
    type: Number,
    min: 0
  },

  cnlc: {
    type: Number,
    min: 0
  },

  mnlc: {
    type: Number,
    min: 0
  },

  // Pricing - Selling
  opPrice: {
    type: Number,
    min: 0
  },

  t1: {
    type: Number,
    min: 0
  },

  t2: {
    type: Number,
    min: 0
  },

  t3: {
    type: Number,
    min: 0
  },

  t4: {
    type: Number,
    min: 0
  },

  bottomPrice: {
    type: Number,
    min: 0
  },

  // Density
  density: {
    type: String,
    enum: ['Regular', 'B2B', 'Back to Back'],
    default: 'Regular'
  },

  // Stock
  stock: {
    type: Number,
    default: 0
  },

  // AccountGST sync
  accountgstProductId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },

  // Legacy fields from AccountGST
  productType: {
    type: String,
    trim: true
  },

  ledgerAccount: {
    type: String,
    trim: true
  },

  syncStatus: {
    type: String,
    enum: ['pending', 'synced', 'failed'],
    default: 'pending'
  },

  lastSyncedAt: {
    type: Date
  },

  active: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

// Indexes for search and filter functionality
productSchema.index({ name: 'text', partNumber: 'text', brand: 'text', category: 'text', subcategory: 'text', description: 'text' });
productSchema.index({ brand: 1 });
productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ brand: 1, category: 1 });
productSchema.index({ brand: 1, category: 1, subcategory: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ accountgstProductId: 1 });

export default mongoose.model('Product', productSchema);