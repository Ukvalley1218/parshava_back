import User from '../../models/User.js';

/**
 * Get all users (sales users)
 * @route GET /api/admin/users
 * @access Private (Admin)
 */
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    const query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @route GET /api/admin/users/:id
 * @access Private (Admin)
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 * @route POST /api/admin/users
 * @access Private (Admin)
 */
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role = 'user', isActive = true, assignedBrands = [] } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Clear assignedBrands for admin/superadmin (they see all)
    const finalAssignedBrands = (role === 'admin' || role === 'superadmin') ? [] : assignedBrands;

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role,
      isActive,
      assignedBrands: finalAssignedBrands
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        assignedBrands: user.assignedBrands,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * @route PUT /api/admin/users/:id
 * @access Private (Admin)
 */
export const updateUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, isActive, assignedBrands } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      updateData.email = email.toLowerCase();
    }
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle assignedBrands
    if (assignedBrands !== undefined) {
      updateData.assignedBrands = assignedBrands;
    }

    // If role changed to admin/superadmin, clear assignedBrands (they see all)
    if (role === 'admin' || role === 'superadmin') {
      updateData.assignedBrands = [];
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If password provided, update it separately
    if (password) {
      const userWithPassword = await User.findById(req.params.id);
      userWithPassword.password = password;
      await userWithPassword.save();
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @route DELETE /api/admin/users/:id
 * @access Private (Admin)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle user status
 * @route PATCH /api/admin/users/:id/toggle-status
 * @access Private (Admin)
 */
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        _id: user._id,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};