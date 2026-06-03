import mongoose from 'mongoose';

const businessCategorySchema = new mongoose.Schema({
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
businessCategorySchema.index({ name: 'text' });
businessCategorySchema.index({ slug: 1 });

// Generate slug before saving
businessCategorySchema.pre('save', function(next) {
  if (this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

const BusinessCategory = mongoose.model('BusinessCategory', businessCategorySchema);
export default BusinessCategory;