import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Brand from './src/models/brand.model.js';
import Category from './src/models/category.model.js';
import Product from './src/models/product.model.js';

async function analyzeRelations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all brands
    const brands = await Brand.find({}).sort({ name: 1 });
    console.log('=== BRANDS ===');
    console.log(`Total brands: ${brands.length}\n`);

    // Get all categories
    const categories = await Category.find({}).populate('brands', 'name').sort({ name: 1 });
    console.log('=== CATEGORIES ===');
    console.log(`Total categories: ${categories.length}\n`);

    // Analyze products to find brand-category relationships
    console.log('=== BRAND-CATEGORY RELATIONSHIPS FROM PRODUCTS ===\n');
    
    const brandCategoryMap = {};
    
    for (const brand of brands) {
      // Find distinct categories for this brand from products
      const productCategories = await Product.distinct('category', {
        brand: { $regex: new RegExp(`^${brand.name}$`, 'i') },
        category: { $ne: null, $ne: '' }
      });
      
      if (productCategories.length > 0) {
        brandCategoryMap[brand.name] = productCategories;
        console.log(`${brand.name}:`);
        productCategories.forEach(cat => console.log(`  - ${cat}`));
        console.log('');
      }
    }

    // Show categories currently linked to brands
    console.log('\n=== CATEGORIES CURRENTLY LINKED TO BRANDS ===\n');
    for (const cat of categories) {
      if (cat.brands && cat.brands.length > 0) {
        const brandNames = cat.brands.map(b => b.name).join(', ');
        console.log(`${cat.name}: [${brandNames}]`);
      } else {
        console.log(`${cat.name}: [NOT LINKED]`);
      }
    }

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Brands: ${brands.length}`);
    console.log(`Categories: ${categories.length}`);
    console.log(`Categories already linked: ${categories.filter(c => c.brands && c.brands.length > 0).length}`);
    console.log(`Categories not linked: ${categories.filter(c => !c.brands || c.brands.length === 0).length}`);

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

analyzeRelations();
