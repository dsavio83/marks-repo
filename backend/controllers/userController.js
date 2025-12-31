const User = require('../models/User');
const { adminAuth, teacherAuth, studentAuth } = require('../middleware/auth');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('classId', 'name');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('classId', 'name');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res) => {
  try {
    const { username, name, role, password, admissionNo, mobile, email, gender, dob, category, caste, religion, fatherName, motherName, address, transportMode, classId } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Role safety: Non-admins can only update STUDENTS
    if (req.user.role !== 'ADMIN' && user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only admins can update teachers or other admins' });
    }

    // Ensure non-admins cannot change a user's role to anything other than STUDENT
    if (req.user.role !== 'ADMIN' && role && role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only admins can assign non-student roles' });
    }

    // Update fields only if they are provided and not empty
    if (username) user.username = username;
    if (name) user.name = name;
    if (role) user.role = role;
    if (admissionNo !== undefined) user.admissionNo = admissionNo;
    if (mobile) user.mobile = mobile;
    if (email !== undefined) user.email = email;
    if (gender) user.gender = gender;
    if (dob) user.dob = dob;
    if (category) user.category = category;
    if (caste !== undefined) user.caste = caste;
    if (religion !== undefined) user.religion = religion;
    if (fatherName !== undefined) user.fatherName = fatherName;
    if (motherName !== undefined) user.motherName = motherName;
    if (address !== undefined) user.address = address;
    if (transportMode) user.transportMode = transportMode;
    if (classId !== undefined) user.classId = classId;

    // Only update password if provided, not empty, and user is not a student
    if (password && password.trim() !== '' && user.role !== 'STUDENT') {
      user.password = password;
    }

    user.updatedAt = new Date();

    await user.save();

    // Return the updated user (toJSON will convert _id to id)
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    res.status(500).json({
      message: error.message || 'Server error',
      details: error.errors ? Object.keys(error.errors).map(key => error.errors[key].message) : []
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get students by class
// @route   GET /api/users/class/:classId
// @access  Private (Teacher/Admin)
const getStudentsByClass = async (req, res) => {
  try {
    const students = await User.find({ role: 'STUDENT', classId: req.params.classId });
    res.json(students);
  } catch (error) {
    console.error('Get students by class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStudentsByClass
};