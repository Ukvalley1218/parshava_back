import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Create indexes
subcategorySchema.index({ name: 'text' });
subcategorySchema.index({ category: 1 });
subcategorySchema.index({ slug: 1 });
subcategorySchema.index({ category: 1, name: 1 }, { unique: true });

// Generate slug before saving
subcategorySchema.pre('save', function(next) {
  if (this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

const Subcategory = mongoose.model('Subcategory', subcategorySchema);
export default Subcategory;