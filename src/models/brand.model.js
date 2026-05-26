import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema({
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
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
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
  subcategories: [subCategorySchema],
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const brandSchema = new mongoose.Schema({
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
  categories: [categorySchema],
  active: {
    type: Boolean,
    default: true
  },
  // Track if this brand was imported from AccountGST products
  isImported: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Create text index for search
brandSchema.index({ name: 'text' });
brandSchema.index({ slug: 1 });

// Generate slug before saving
brandSchema.pre('save', function(next) {
  if (this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

// Generate slug for categories before saving
brandSchema.pre('save', function(next) {
  this.categories.forEach(category => {
    if (category.name) {
      category.slug = category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      category.subcategories.forEach(sub => {
        if (sub.name) {
          sub.slug = sub.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }
      });
    }
  });
  next();
});

const Brand = mongoose.model('Brand', brandSchema);
export default Brand;