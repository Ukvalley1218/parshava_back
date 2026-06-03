import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration Script: Extract categories/subcategories from Brand to independent models
 *
 * This script uses raw MongoDB to access the embedded categories before the schema change
 */

const migrate = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get raw collections
    const db = mongoose.connection.db;
    const brandsCollection = db.collection('brands');
    const categoriesCollection = db.collection('categories');
    const subcategoriesCollection = db.collection('subcategories');
    const productsCollection = db.collection('products');

    // Step 1: Get all brands with categories using raw MongoDB
    const brands = await brandsCollection.find({}).toArray();
    console.log(`📦 Found ${brands.length} brands`);

    // Step 2: Extract unique categories
    const allCategories = new Set();
    const categorySubcategories = new Map(); // categoryName -> Set of subcategory names

    for (const brand of brands) {
      if (brand.categories && Array.isArray(brand.categories)) {
        for (const category of brand.categories) {
          allCategories.add(category.name);

          if (!categorySubcategories.has(category.name)) {
            categorySubcategories.set(category.name, new Set());
          }

          if (category.subcategories && Array.isArray(category.subcategories)) {
            for (const sub of category.subcategories) {
              categorySubcategories.get(category.name).add(sub.name);
            }
          }
        }
      }
    }

    console.log(`📋 Found ${allCategories.size} unique categories`);

    // Step 3: Create Category documents
    console.log('\n🔄 Creating Category documents...');
    const categoryMap = new Map(); // categoryName -> categoryId

    for (const categoryName of allCategories) {
      // Check if category already exists
      const existingCategory = await categoriesCollection.findOne({
        name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
      });

      if (!existingCategory) {
        const result = await categoriesCollection.insertOne({
          name: categoryName,
          slug: categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        categoryMap.set(categoryName.toLowerCase(), result.insertedId);
        console.log(`  ✓ Created category: ${categoryName}`);
      } else {
        categoryMap.set(categoryName.toLowerCase(), existingCategory._id);
        console.log(`  → Category already exists: ${categoryName}`);
      }
    }

    // Step 4: Create Subcategory documents
    console.log('\n🔄 Creating Subcategory documents...');
    const subcategoryMap = new Map(); // "categoryName|subcategoryName" -> subcategoryId
    let subcategoryCount = 0;

    for (const [categoryName, subcategories] of categorySubcategories) {
      const categoryId = categoryMap.get(categoryName.toLowerCase());

      if (!categoryId) {
        console.log(`  ⚠ Category not found: ${categoryName}`);
        continue;
      }

      for (const subcategoryName of subcategories) {
        const key = `${categoryName.toLowerCase()}|${subcategoryName.toLowerCase()}`;

        // Check if subcategory already exists
        const existingSubcategory = await subcategoriesCollection.findOne({
          name: { $regex: new RegExp(`^${subcategoryName}$`, 'i') },
          category: categoryId
        });

        if (!existingSubcategory) {
          const result = await subcategoriesCollection.insertOne({
            name: subcategoryName,
            slug: subcategoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            category: categoryId,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          subcategoryMap.set(key, result.insertedId);
          subcategoryCount++;
          console.log(`  ✓ Created subcategory: ${subcategoryName} (under ${categoryName})`);
        } else {
          subcategoryMap.set(key, existingSubcategory._id);
          console.log(`  → Subcategory already exists: ${subcategoryName}`);
        }
      }
    }

    // Step 5: Update Product documents
    console.log('\n🔄 Updating Product documents...');
    const products = await productsCollection.find({}).toArray();
    let updatedCount = 0;

    for (const product of products) {
      const updates = {};

      // Update categoryId if category name exists
      if (product.category) {
        const categoryId = categoryMap.get(product.category.toLowerCase());
        if (categoryId) {
          updates.categoryId = categoryId;
        }
      }

      // Update subcategoryId if subcategory name exists
      if (product.subcategory && product.category) {
        const key = `${product.category.toLowerCase()}|${product.subcategory.toLowerCase()}`;
        const subcategoryId = subcategoryMap.get(key);
        if (subcategoryId) {
          updates.subcategoryId = subcategoryId;
        }
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await productsCollection.updateOne(
          { _id: product._id },
          { $set: updates }
        );
        updatedCount++;
      }
    }

    console.log(`  ✓ Updated ${updatedCount} products`);

    // Step 6: Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   - Categories created: ${allCategories.size}`);
    console.log(`   - Subcategories created: ${subcategoryCount}`);
    console.log(`   - Products updated: ${updatedCount}`);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n⚠️  IMPORTANT: Brands still have embedded categories.');
    console.log('   Run with --clean flag to remove embedded categories from brands.');
    console.log('   Example: node src/scripts/migrateCategories.js --clean');

    // Check for --clean flag
    if (process.argv.includes('--clean')) {
      console.log('\n🔄 Cleaning up Brand documents...');
      await brandsCollection.updateMany({}, { $unset: { categories: 1 } });
      console.log('  ✓ Removed embedded categories from all brands');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
migrate();