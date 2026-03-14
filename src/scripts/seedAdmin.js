/**
 * Seed Admin User Script
 *
 * Run this script to create an initial admin user:
 * node src/scripts/seedAdmin.js
 *
 * Or use npm script:
 * npm run seed:admin
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.name);
      process.exit(0);
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@paarshva.com',
      password: 'admin123', // Will be hashed automatically
      role: 'admin',
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('---');
    console.log('Email:', adminUser.email);
    console.log('Password: admin123');
    console.log('---');
    console.log('⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();