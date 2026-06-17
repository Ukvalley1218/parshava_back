import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Brand from './src/models/brand.model.js';
import Category from './src/models/category.model.js';
import Product from './src/models/product.model.js';

// Helper function to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function linkCategoriesToBrands() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all brands and create a name-to-id map
    const brands = await Brand.find({}).sort({ name: 1 });
    const brandNameToId = {};
    brands.forEach(brand => {
      brandNameToId[brand.name.toLowerCase()] = brand._id;
    });
    console.log(`Found ${brands.length} brands\n`);

    // Get all categories
    const categories = await Category.find({}).sort({ name: 1 });
    console.log(`Found ${categories.length} categories\n`);

    // For each category, find brands that have products in that category
    const updatePromises = [];
    const results = [];

    for (const category of categories) {
      // Escape special regex characters in category name
      const escapedName = escapeRegExp(category.name);

      // Find distinct brands for this category from products
      const brandNames = await Product.distinct('brand', {
        category: { $regex: new RegExp(`^${escapedName}$`, 'i') },
        brand: { $ne: null, $ne: '' }
      });

      // Map brand names to brand ObjectIds
      const brandIds = [];
      const linkedBrandNames = [];

      for (const brandName of brandNames) {
        if (brandName) {
          const brandId = brandNameToId[brandName.toLowerCase()];
          if (brandId) {
            brandIds.push(brandId);
            linkedBrandNames.push(brandName);
          }
        }
      }

      if (brandIds.length > 0) {
        // Update category with brand IDs
        const updatePromise = Category.findByIdAndUpdate(
          category._id,
          { brands: brandIds },
          { new: true }
        ).then(updated => {
          results.push({
            category: category.name,
            brands: linkedBrandNames
          });
          return updated;
        });
        updatePromises.push(updatePromise);
      } else {
        results.push({
          category: category.name,
          brands: []
        });
      }
    }

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    // Sort results by category name
    results.sort((a, b) => a.category.localeCompare(b.category));

    // Print results
    console.log('=== LINKING RESULTS ===\n');
    let linkedCount = 0;
    let notLinkedCount = 0;

    for (const result of results) {
      if (result.brands.length > 0) {
        linkedCount++;
        console.log(`✓ ${result.category}:`);
        result.brands.forEach(b => console.log(`    - ${b}`));
      } else {
        notLinkedCount++;
        console.log(`✗ ${result.category}: [NO BRANDS LINKED]`);
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total categories: ${categories.length}`);
    console.log(`Categories linked to brands: ${linkedCount}`);
    console.log(`Categories not linked: ${notLinkedCount}`);

    await mongoose.disconnect();
    console.log('\nDone! Categories have been linked to brands.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

linkCategoriesToBrands();
