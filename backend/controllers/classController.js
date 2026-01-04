const ClassRoom = require('../models/ClassRoom');
const User = require('../models/User');
const SubjectAssignment = require('../models/SubjectAssignment');

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private (Admin/Teacher)
const getAllClasses = async (req, res) => {
  try {
    const classes = await ClassRoom.find()
      .populate('classTeacherId', 'name username')
      .lean();

    // Transform to ensure frontend compatibility
    const formattedClasses = classes.map(c => ({
      ...c,
      id: c._id.toString(),
      classTeacherId: c.classTeacherId ? { ...c.classTeacherId, id: c.classTeacherId._id ? c.classTeacherId._id.toString() : '' } : null
    }));

    formattedClasses.forEach(c => {
      delete c._id;
      delete c.__v;
      if (c.classTeacherId) delete c.classTeacherId._id;
    });

    res.json(formattedClasses);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get class by ID
// @route   GET /api/classes/:id
// @access  Private (Admin/Teacher)
const getClassById = async (req, res) => {
  try {
    const classRoom = await ClassRoom.findById(req.params.id)
      .populate('classTeacherId', 'name username');

    if (!classRoom) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(classRoom);
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new class
// @route   POST /api/classes
// @access  Private (Admin only)
const createClass = async (req, res) => {
  try {
    const { name, section, gradeLevel, classTeacherId, subjects } = req.body;

    // Check if class teacher exists and is a teacher
    if (classTeacherId) {
      const teacher = await User.findById(classTeacherId);
      if (!teacher || teacher.role !== 'TEACHER') {
        return res.status(400).json({ message: 'Invalid class teacher' });
      }
    }

    const classRoom = new ClassRoom({
      name,
      section,
      gradeLevel,
      classTeacherId
    });

    await classRoom.save();

    // Create subject assignments if provided
    if (subjects && subjects.length > 0) {
      const assignments = subjects.map(sub => ({
        classId: classRoom._id,
        subjectId: sub.subjectId,
        teacherId: sub.teacherId
      }));
      await SubjectAssignment.insertMany(assignments);
    }

    // Populate the class teacher for the response
    await classRoom.populate('classTeacherId', 'name username');

    res.status(201).json(classRoom);
  } catch (error) {
    console.error('Create class error:', error);
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

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private (Admin only)
const updateClass = async (req, res) => {
  try {
    const { name, section, gradeLevel, classTeacherId, subjects } = req.body;

    const classRoom = await ClassRoom.findById(req.params.id);
    if (!classRoom) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if class teacher exists and is a teacher
    if (classTeacherId) {
      const teacher = await User.findById(classTeacherId);
      if (!teacher || teacher.role !== 'TEACHER') {
        return res.status(400).json({ message: 'Invalid class teacher' });
      }
      classRoom.classTeacherId = classTeacherId;
    }

    classRoom.name = name || classRoom.name;
    classRoom.section = section || classRoom.section;
    classRoom.gradeLevel = gradeLevel || classRoom.gradeLevel;
    classRoom.updatedAt = new Date();

    await classRoom.save();

    // Update subject assignments if provided
    if (subjects !== undefined) {
      // Delete existing subject assignments for this class
      await SubjectAssignment.deleteMany({ classId: req.params.id });

      // Create new subject assignments
      if (subjects.length > 0) {
        const assignments = subjects.map(sub => ({
          classId: classRoom._id,
          subjectId: sub.subjectId,
          teacherId: sub.teacherId
        }));
        await SubjectAssignment.insertMany(assignments);
      }
    }

    // Populate the class teacher for the response
    await classRoom.populate('classTeacherId', 'name username');

    res.json(classRoom);
  } catch (error) {
    console.error('Update class error:', error);
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

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private (Admin only)
const deleteClass = async (req, res) => {
  try {
    const classRoom = await ClassRoom.findById(req.params.id);
    if (!classRoom) {
      return res.status(404).json({ message: 'Class not found' });
    }

    await ClassRoom.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get subjects assigned to class
// @route   GET /api/classes/:id/subjects
// @access  Private (Admin/Teacher)
const getClassSubjects = async (req, res) => {
  try {
    const subjects = await SubjectAssignment.find({ classId: req.params.id })
      .populate('subjectId', 'name shortCode')
      .populate('teacherId', 'name username')
      .lean();

    const validSubjects = subjects
      .filter(s => s.subjectId && s.teacherId) // Filter orphans
      .map(s => ({
        ...s,
        id: s._id.toString(),
        subjectId: { ...s.subjectId, id: s.subjectId._id ? s.subjectId._id.toString() : '' },
        teacherId: { ...s.teacherId, id: s.teacherId._id ? s.teacherId._id.toString() : '' }
      }));

    validSubjects.forEach(s => {
      delete s._id;
      delete s.__v;
      if (s.subjectId) delete s.subjectId._id;
      if (s.teacherId) delete s.teacherId._id;
    });

    res.json(validSubjects);
  } catch (error) {
    console.error('Get class subjects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all subject assignments (for populating app state)
// @route   GET /api/classes/assignments/all
// @access  Private (Admin/Teacher)
const getAllAssignments = async (req, res) => {
  try {
    // Use lean() to avoid CastError on invalid data and improve performance
    const assignments = await SubjectAssignment.find().lean();

    // Transform and filter
    const formattedAssignments = assignments
      .map(doc => ({
        ...doc,
        id: doc._id.toString(),
        // Convert ObjectIds to strings if they exist, handle potential bad data
        subjectId: doc.subjectId ? doc.subjectId.toString() : null,
        classId: doc.classId ? doc.classId.toString() : null,
        teacherId: doc.teacherId ? doc.teacherId.toString() : null
      }))
      // Filter out invalid assignments
      .filter(a => a.subjectId && a.subjectId !== '' && a.classId && a.teacherId);

    // Remove _id and __v
    formattedAssignments.forEach(a => {
      delete a._id;
      delete a.__v;
    });

    res.json(formattedAssignments);
  } catch (error) {
    console.error('Get all assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassSubjects,
  getAllAssignments
};