import mongoose from 'mongoose';

const brandCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Create text index for search
brandCategorySchema.index({ name: 'text' });
brandCategorySchema.index({ slug: 1 });

// Generate slug before saving
brandCategorySchema.pre('save', function(next) {
  if (this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

const BrandCategory = mongoose.model('BrandCategory', brandCategorySchema);
export default BrandCategory;