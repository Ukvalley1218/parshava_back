import mongoose from 'mongoose';

const contactPersonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    default: ''
  },
  mobile: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ''
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  isWhatsApp: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const enquirySchema = new mongoose.Schema({
  enquiryId: {
    type: String,
    unique: true,
    sparse: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerDetails: {
    firmName: String,
    name: String,
    mobile: String,
    email: String,
    address: String,
    city: String,
    state: String,
    gstin: String
  },
  contactPerson: contactPersonSchema,
  accountManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'quoted', 'closed'],
    default: 'open'
  },
  relatedQuotation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inquiry',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

enquirySchema.index({ customerId: 1 });
enquirySchema.index({ status: 1 });
enquirySchema.index({ createdBy: 1 });
enquirySchema.index({ assignedTo: 1 });

export default mongoose.model('Enquiry', enquirySchema);