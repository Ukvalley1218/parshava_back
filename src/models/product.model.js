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

  // Brand - Independent
  brand: {
    type: String,
    trim: true,
    maxlength: 100
  },

  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  },

  // Category - Independent
  category: {
    type: String,
    trim: true,
    maxlength: 100
  },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },

  // Subcategory - Linked to Category
  subcategory: {
    type: String,
    trim: true,
    maxlength: 100
  },

  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory'
  },

  // Series - Linked to Category (NEW)
  series: {
    type: String,
    trim: true,
    maxlength: 100
  },

  seriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Series'
  },

  // Sub-Series - Linked to Series
  subSeries: {
    type: String,
    trim: true,
    maxlength: 50
  },

  subSeriesId: {
    type: mongoose.Schema.Types.ObjectId
    // This is a subdocument ID within the series.subSeries array
    // Not a direct reference to a separate model
  },

  subSeriesCode: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: 10
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

  marketPrice: {
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

  // Price List Categories (C1, SI1, SI2, T1, T2)
  c1: {
    type: Number,
    min: 0
  },

  si1: {
    type: Number,
    min: 0
  },

  si2: {
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

  // Legacy tier prices (kept for backward compatibility)
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

  // Pricing Calculator Fields
  basePriceType: {
    type: String,
    enum: ['mop', 'purchase', 'market'],
    default: 'mop'
  },

  // Discounts
  dis1: { type: Number, min: 0, default: 0 },
  dis1Type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  dis2: { type: Number, min: 0, default: 0 },
  dis2Type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  dis3: { type: Number, min: 0, default: 0 },
  dis3Type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  dis4: { type: Number, min: 0, default: 0 },
  dis4Type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  dis5: { type: Number, min: 0, default: 0 },
  dis5Type: { type: String, enum: ['percent', 'flat'], default: 'percent' },

  // Net Landing Cost (calculated)
  nlc: {
    type: Number,
    min: 0,
    default: 0
  },

  // Profit
  profit: { type: Number, min: 0, default: 0 },
  profitType: { type: String, enum: ['percent', 'flat'], default: 'percent' },

  // OP Prices (Output Prices for each price list category)
  // C1 - Customer Tier 1
  opC1: { type: Number, min: 0, default: 0 },
  opC1Type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  // SI1 - System Integrator Tier 1
  opSi1: { type: Number, min: 0, default: 0 },
  opSi1Type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  // SI2 - System Integrator Tier 2
  opSi2: { type: Number, min: 0, default: 0 },
  opSi2Type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  // T1 - Trader Tier 1
  opT1: { type: Number, min: 0, default: 0 },
  opT1Type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  // T2 - Trader Tier 2
  opT2: { type: Number, min: 0, default: 0 },
  opT2Type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  // Legacy OP fields (kept for backward compatibility)
  op1: { type: Number, min: 0, default: 0 },
  op1Type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  op2: { type: Number, min: 0, default: 0 },
  op2Type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  op3: { type: Number, min: 0, default: 0 },
  op3Type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  op4: { type: Number, min: 0, default: 0 },

  // Density
  density: {
    type: String,
    enum: ['Regular', 'B2B', 'Back to Back'],
    default: 'Regular'
  },

  // Box Size (dimensions or size info)
  boxSize: {
    type: String,
    trim: true,
    maxlength: 100
  },

  // Procurement info (purchase source, lead time, etc.)
  procurement: {
    type: String,
    trim: true,
    maxlength: 200
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
productSchema.index({ name: 'text', partNumber: 'text', brand: 'text', category: 'text', subcategory: 'text', series: 'text', description: 'text' });
productSchema.index({ brand: 1 });
productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ series: 1 });
productSchema.index({ brandId: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ subcategoryId: 1 });
productSchema.index({ seriesId: 1 });
productSchema.index({ categoryId: 1, subcategoryId: 1 });
productSchema.index({ categoryId: 1, seriesId: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ accountgstProductId: 1 });

export default mongoose.model('Product', productSchema);