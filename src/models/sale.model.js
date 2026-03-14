import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  invoiceNo: {
    type: String,
    required: [true, 'Invoice number is required'],
    trim: true,
    index: true
  },
  invoiceDate: {
    type: Date,
    required: [true, 'Invoice date is required']
  },
  customerName: {
    type: String,
    trim: true,
    maxlength: [200, 'Customer name cannot exceed 200 characters']
  },
  taxableValue: {
    type: Number,
    default: 0,
    min: [0, 'Taxable value cannot be negative']
  },
  gstValue: {
    type: Number,
    default: 0,
    min: [0, 'GST value cannot be negative']
  },
  totalValue: {
    type: Number,
    default: 0,
    min: [0, 'Total value cannot be negative']
  },
  paidStatus: {
    type: String,
    trim: true,
    enum: ['paid', 'unpaid', 'partial', ''],
    default: ''
  },
  accountgstInvoiceId: {
    type: String,
    trim: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  syncStatus: {
    type: String,
    enum: ['pending', 'synced', 'failed'],
    default: 'synced'
  },
  lastSyncedAt: {
    type: Date
  },
  billId: {
  type: String,
  index: true
},

receivedAmount: {
  type: Number,
  default: 0
},

pendingAmount: {
  type: Number,
  default: 0
},

invoiceStatus: {
  type: String
}
}, {
  timestamps: true
});

// Indexes for better query performance
saleSchema.index({ invoiceNo: 1 }, { unique: true });
saleSchema.index({ invoiceDate: 1 });
saleSchema.index({ customerId: 1 });
saleSchema.index({ paidStatus: 1 });

export default mongoose.model('Sale', saleSchema);