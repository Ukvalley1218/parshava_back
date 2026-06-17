import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
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
  // Linked brands - array of brand ObjectIds or brand names
  brands: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  }],
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Create text index for search
categorySchema.index({ name: 'text' });
categorySchema.index({ slug: 1 });
categorySchema.index({ brands: 1 });

// Generate slug before saving
categorySchema.pre('save', function(next) {
  if (this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);
export default Category;