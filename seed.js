import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';

// Load environment variables
dotenv.config();

// Seed data
const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@gmail.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '+91 9876543210',
    isActive: true
  },
  {
    name: 'Paarshva User',
    email: 'parshva@gmail.com',
    password: 'parshva@123',
    role: 'user',
    phone: '+91 9876543211',
    isActive: true
  }
];

// Connect to database
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/paarshva';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Seed database
const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('\n📦 Seeding database...\n');

    for (const userData of seedUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email}`);

        // Optionally update existing user
        if (process.argv.includes('--update')) {
          existingUser.name = userData.name;
          existingUser.role = userData.role;
          existingUser.phone = userData.phone;
          existingUser.isActive = userData.isActive;

          // Only update password if --reset-password flag is provided
          if (process.argv.includes('--reset-password')) {
            existingUser.password = userData.password;
            console.log(`   🔑 Password reset for: ${userData.email}`);
          }

          await existingUser.save();
          console.log(`   ✏️  User updated: ${userData.email}`);
        }
        continue;
      }

      // Create new user (password will be hashed by pre-save hook)
      const user = await User.create(userData);
      console.log(`✅ User created: ${user.email} (${user.role})`);
    }

    console.log('\n🎉 Seeding completed!\n');
    console.log('📋 Credentials Summary:');
    console.log('   ┌─────────────────────────────────────────────────┐');
    console.log('   │  Admin Login                                     │');
    console.log('   │  Email:    admin@gmail.com                       │');
    console.log('   │  Password: Admin@123                             │');
    console.log('   ├─────────────────────────────────────────────────┤');
    console.log('   │  User Login                                      │');
    console.log('   │  Email:    parshva@gmail.com                     │');
    console.log('   │  Password: parshva@123                           │');
    console.log('   └─────────────────────────────────────────────────┘\n');

    // Close connection
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    process.exit(1);
  }
};

// Run seed
seedDatabase();