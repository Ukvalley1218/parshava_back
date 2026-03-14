import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

class AuthService {
  // Register new user
  async register(userData) {
    const { name, email, password, role } = userData;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    const token = generateToken(user._id);

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  // Login user
  async login(email, password) {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Your account has been deactivated');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user._id);

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  // Get user by ID
  async getUserById(id) {
    return await User.findById(id);
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    return await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return true;
  }
}

export default new AuthService();