import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  // Name
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // Linked Customer/Firm (optional - links to Customer collection)
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

  // Mobile Numbers
  mobile1: {
    type: String,
    trim: true,
    maxlength: 15
  },

  mobile2: {
    type: String,
    trim: true,
    maxlength: 15
  },

  mobile3: {
    type: String,
    trim: true,
    maxlength: 15
  },

  // Photo URL
  photo: {
    type: String,
    trim: true
  },

  // Aadhar Number
  aadharNumber: {
    type: String,
    trim: true,
    maxlength: 12
  },

  // PAN Number
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: 10
  },

  // Status
  status: {
    type: String,
    enum: ['new', 'in_progress', 'resolved', 'closed'],
    default: 'new'
  },

  // Email
  email: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Is Primary Contact
  isPrimary: {
    type: Boolean,
    default: false
  },

  // Has WhatsApp
  isWhatsApp: {
    type: Boolean,
    default: true
  },

  // Internal Notes
  notes: {
    type: String,
    trim: true
  }

}, { timestamps: true });

// Text Search Index
contactSchema.index({
  name: 'text',
  firmName: 'text',
  mobile1: 'text',
  mobile2: 'text',
  mobile3: 'text',
  city: 'text'
});

// Other Indexes
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ customer: 1 });

export default mongoose.model('Contact', contactSchema);