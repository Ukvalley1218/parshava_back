import mongoose from 'mongoose';

const inquiryItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  imgurl: {
    type: String,
    default: null
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  qty: {
    type: Number,
    required: true,
    min: 1
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  gstRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: true });

const inquirySchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false // Optional for draft carts - set when inquiry is submitted
  },
  customerDetails: {
  name: String,
  mobile: String,
  email: String,
  address: String,
  city: String,
  state: String,
  gstin: String
},
  status: {
    type: String,
    enum: ['draft', 'converted', 'cancelled'],
    default: 'draft'
  },
  items: [inquiryItemSchema],
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  discountTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  gstTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  grandTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

inquirySchema.index({ customerId: 1 });
inquirySchema.index({ status: 1 });
inquirySchema.index({ createdBy: 1 });

export default mongoose.model('Inquiry', inquirySchema);