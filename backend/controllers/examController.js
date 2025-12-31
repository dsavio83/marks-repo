const Exam = require('../models/Exam');
const ClassRoom = require('../models/ClassRoom');
const Subject = require('../models/Subject');

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private (Admin/Teacher)
const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('classId', 'name section gradeLevel')
      .populate('subjectConfigs.subjectId', 'name shortCode');
    res.json(exams);
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get exam by ID
// @route   GET /api/exams/:id
// @access  Private (Admin/Teacher)
const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('classId', 'name section gradeLevel')
      .populate('subjectConfigs.subjectId', 'name shortCode');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json(exam);
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private (Admin/Teacher)
const createExam = async (req, res) => {
  try {
    const { name, classId, subjectConfigs } = req.body;

    // Check if class exists
    const classRoom = await ClassRoom.findById(classId);
    if (!classRoom) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Validate subject configurations
    if (!subjectConfigs || subjectConfigs.length === 0) {
      return res.status(400).json({ message: 'At least one subject configuration is required' });
    }

    // Check if subjects exist
    for (const config of subjectConfigs) {
      const subId = typeof config.subjectId === 'object' ? (config.subjectId._id || config.subjectId.id) : config.subjectId;
      const subject = await Subject.findById(subId);
      if (!subject) {
        return res.status(404).json({ message: `Subject with ID ${subId} not found` });
      }
      // Ensure it's stored as simple ID string
      config.subjectId = subId;
    }

    const exam = new Exam({
      name,
      classId,
      subjectConfigs
    });

    await exam.save();

    const populatedExam = await Exam.findById(exam._id)
      .populate('classId', 'name section gradeLevel')
      .populate('subjectConfigs.subjectId', 'name shortCode');

    res.status(201).json({
      message: 'Exam created successfully',
      exam: populatedExam
    });
  } catch (error) {
    console.error('Create exam error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Admin/Teacher)
const updateExam = async (req, res) => {
  try {
    const { name, classId, subjectConfigs } = req.body;

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if class exists
    if (classId) {
      const classRoom = await ClassRoom.findById(classId);
      if (!classRoom) {
        return res.status(404).json({ message: 'Class not found' });
      }
      exam.classId = classId;
    }

    // Validate subject configurations
    if (subjectConfigs) {
      if (subjectConfigs.length === 0) {
        return res.status(400).json({ message: 'At least one subject configuration is required' });
      }

      // Check if subjects exist
      for (const config of subjectConfigs) {
        const subId = typeof config.subjectId === 'object' ? (config.subjectId._id || config.subjectId.id) : config.subjectId;
        const subject = await Subject.findById(subId);
        if (!subject) {
          return res.status(404).json({ message: `Subject with ID ${subId} not found` });
        }
        // Ensure it's stored as simple ID string
        config.subjectId = subId;
      }

      exam.subjectConfigs = subjectConfigs;
    }

    exam.name = name || exam.name;
    exam.updatedAt = new Date();

    await exam.save();

    const populatedExam = await Exam.findById(exam._id)
      .populate('classId', 'name section gradeLevel')
      .populate('subjectConfigs.subjectId', 'name shortCode');

    res.json({
      message: 'Exam updated successfully',
      exam: populatedExam
    });
  } catch (error) {
    console.error('Update exam error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Admin/Teacher)
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get exams by class
// @route   GET /api/exams/class/:classId
// @access  Private (Admin/Teacher)
const getExamsByClass = async (req, res) => {
  try {
    const exams = await Exam.find({ classId: req.params.classId })
      .populate('classId', 'name section gradeLevel')
      .populate('subjectConfigs.subjectId', 'name shortCode');

    res.json(exams);
  } catch (error) {
    console.error('Get exams by class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getExamsByClass
};