import mongoose from 'mongoose';

const seriesSchema = new mongoose.Schema({
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
seriesSchema.index({ name: 'text' });
seriesSchema.index({ category: 1 });
seriesSchema.index({ slug: 1 });
seriesSchema.index({ category: 1, name: 1 }, { unique: true });

// Generate slug before saving
seriesSchema.pre('save', function(next) {
  if (this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

const Series = mongoose.model('Series', seriesSchema);
export default Series;