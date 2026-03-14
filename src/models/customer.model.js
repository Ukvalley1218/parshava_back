import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },

  code: {
    type: String,
    trim: true
  },

  cityId: {
  type: String
},

stateId: {
  type: String
},

contactPerson: {
  type: String
},
  mobile: {
    type: String,
    trim: true,
    maxlength: 15
  },

  alternateMobile: {
    type: String,
    trim: true
  },

  email: {
    type: String,
    trim: true,
    lowercase: true
  },

  address: {
    type: String,
    trim: true,
    maxlength: 200
  },

  city: {
    type: String,
    trim: true
  },

  state: {
    type: String,
    trim: true
  },

  pincode: {
    type: String,
    trim: true
  },

  gstin: {
    type: String,
    trim: true,
    uppercase: true
  },

  refType: {
    type: String
  },

  status: {
    type: String
  },

  accountgstId: {
    type: String,
    unique: true,
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

customerSchema.index({ name: 'text', mobile: 'text' });
customerSchema.index({ city: 1 });

export default mongoose.model('Customer', customerSchema);