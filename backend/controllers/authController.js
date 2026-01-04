const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Private (Admin only)
const registerUser = async (req, res) => {
  try {
    const { username, name, role, password, admissionNo, mobile, email, gender, dob, category, caste, religion, fatherName, motherName, address, transportMode, classId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Role safety: Non-admins can only register STUDENTS
    if (req.user.role !== 'ADMIN' && role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only admins can register teachers or other admins' });
    }

    // Create new user
    const user = new User({
      username,
      name,
      role,
      password: role !== 'STUDENT' ? password : undefined,
      admissionNo,
      mobile,
      email,
      gender,
      dob,
      category,
      caste,
      religion,
      fatherName,
      motherName,
      address,
      transportMode,
      classId
    });

    await user.save();

    res.status(201).json(user);
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    res.status(500).json({
      message: error.message || 'Server error during registration',
      details: error.errors ? Object.keys(error.errors).map(key => error.errors[key].message) : []
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // For students, password is their mobile number
    let isPasswordValid = false;
    if (user.role === 'STUDENT') {
      isPasswordValid = user.mobile === password;
    } else {
      isPasswordValid = await user.comparePassword(password);
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        mobile: user.mobile,
        email: user.email,
        classId: user.classId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').lean();
    if (user) {
      user.id = user._id.toString();
      delete user._id;
      delete user.__v;
    }
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile
};