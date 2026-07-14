import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  // Name (split into parts)
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  middleName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  // Full name (computed or for backward compatibility)
  name: {
    type: String,
    trim: true,
    maxlength: 150
  },

  // Linked Customers/Firms (multiple - links to Customer collection)
  customers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],

  // Backward compatibility - single customer reference
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },

  // Firm Name (for backward compatibility and manual entry)
  firmName: {
    type: String,
    trim: true,
    maxlength: 150
  },

  // Designation
  designation: {
    type: String,
    trim: true,
    maxlength: 100
  },

  // Landmark
  landmark: {
    type: String,
    trim: true,
    maxlength: 200
  },

  // City
  city: {
    type: String,
    trim: true,
    maxlength: 100
  },

  // Mobile Numbers with WhatsApp flags
  mobile1: {
    type: String,
    trim: true,
    maxlength: 15
  },
  mobile1WhatsApp: {
    type: Boolean,
    default: false
  },
  mobile2: {
    type: String,
    trim: true,
    maxlength: 15
  },
  mobile2WhatsApp: {
    type: Boolean,
    default: false
  },
  mobile3: {
    type: String,
    trim: true,
    maxlength: 15
  },
  mobile3WhatsApp: {
    type: Boolean,
    default: false
  },

  // Photo URL
  photo: {
    type: String,
    trim: true
  },

  // Email
  email: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Aadhar Card
  aadharCard: {
    type: String,
    trim: true
  },

  // PAN Card
  panCard: {
    type: String,
    trim: true
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },

  // Is Primary Contact
  isPrimary: {
    type: Boolean,
    default: false
  },

  // Internal Notes
  notes: {
    type: String,
    trim: true
  }

}, { timestamps: true });

// Pre-save middleware to compute full name
contactSchema.pre('save', function(next) {
  const parts = [this.firstName, this.middleName, this.lastName].filter(Boolean)
  if (parts.length > 0) {
    this.name = parts.join(' ')
  }
  next()
})

// Text Search Index
contactSchema.index({
  name: 'text',
  firstName: 'text',
  lastName: 'text',
  firmName: 'text',
  mobile1: 'text',
  mobile2: 'text',
  mobile3: 'text',
  city: 'text',
  email: 'text'
});

// Other Indexes
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ customer: 1 });
contactSchema.index({ customers: 1 });

export default mongoose.model('Contact', contactSchema);