import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
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

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required']
  },
  inquiryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inquiry'
  },
  items: [orderItemSchema],
  subtotal: {
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
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  accountgstInvoiceId: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdBy: 1 });

export default mongoose.model('Order', orderSchema);