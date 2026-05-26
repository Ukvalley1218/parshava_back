import mongoose from 'mongoose';

// Contact Person Schema
const contactPersonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  designation: {
    type: String,
    trim: true
  },

  mobile: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    trim: true,
    lowercase: true
  },

  isPrimary: {
    type: Boolean,
    default: false
  },

  isWhatsApp: {
    type: Boolean,
    default: true
  }

}, { _id: true });


// Document Schema
const documentSchema = new mongoose.Schema({
  name: String,
  url: String,
  type: String
}, { _id: true });


const customerSchema = new mongoose.Schema({

  // Software Details
  softwareId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },

  code: {
    type: String,
    trim: true
  },

  // Firm Details
  firmName: {
    type: String,
    trim: true,
    maxlength: 150
  },

  firmPhoto: {
    type: String
  },

  customerPhoto: {
    type: String
  },

  // Primary Customer Name
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },

  designation: {
    type: String,
    trim: true
  },

  // Primary Contact (Backward Compatibility)
  contactPerson: {
    type: String
  },

  mobile: {
    type: String,
    trim: true,
    maxlength: 15
  },

  isWhatsApp: {
    type: Boolean,
    default: true
  },

  mobile2: {
    type: String,
    trim: true
  },

  mobile2Whatsapp: {
    type: Boolean,
    default: false
  },

  mobile3: {
    type: String,
    trim: true
  },

  mobile3Whatsapp: {
    type: Boolean,
    default: false
  },

  landline: {
    type: String,
    trim: true
  },

  email: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Multiple Contacts
  contactPersons: [contactPersonSchema],

  // Address
  address: {
    type: String,
    trim: true,
    maxlength: 300
  },

  googleLocation: {
    type: String,
    trim: true
  },

  landmark: {
    type: String,
    trim: true
  },

  city: {
    type: String,
    trim: true
  },

  cityId: {
    type: String
  },

  state: {
    type: String,
    trim: true
  },

  stateId: {
    type: String
  },

  pincode: {
    type: String,
    trim: true
  },

  country: {
    type: String,
    default: 'India'
  },

  // Business Documents
  gstin: {
    type: String,
    trim: true,
    uppercase: true
  },

  panNumber: {
    type: String,
    trim: true,
    uppercase: true
  },

  aadharNumber: {
    type: String,
    trim: true
  },

  shopActNumber: {
    type: String,
    trim: true
  },

  msmeNumber: {
    type: String,
    trim: true
  },

  documents: [documentSchema],

  // Price List
  priceListCategory: {
    type: String,
    enum: ['T1', 'T2', 'T3', 'T4'],
    default: 'T1'
  },

  // Internal Managers
  accountManager: {
    type: String,
    trim: true
  },

  productManager: {
    type: String,
    trim: true
  },

  // CRM Details
  customerType: {
    type: String,
    enum: ['dealer', 'retailer', 'distributor', 'customer'],
    default: 'customer'
  },

  customerStatus: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },

  leadSource: {
    type: String,
    trim: true
  },

  notes: {
    type: String,
    trim: true
  },

  // Existing ERP Fields
  refType: {
    type: String
  },

  status: {
    type: String
  },

  accountgstId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

  outstanding: {
    type: Number,
    default: 0
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


// Text Search Index
customerSchema.index({
  firmName: 'text',
  name: 'text',
  mobile: 'text',
  email: 'text',
  gstin: 'text',
  panNumber: 'text',
  contactPerson: 'text'
});


// Other Indexes
customerSchema.index({ city: 1 });
customerSchema.index({ createdAt: -1 });
customerSchema.index({ softwareId: 1 });
customerSchema.index({ mobile: 1 });
customerSchema.index({ gstin: 1 });


export default mongoose.model('Customer', customerSchema);