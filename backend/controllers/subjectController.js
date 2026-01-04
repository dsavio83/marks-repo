const Subject = require('../models/Subject');
const SubjectAssignment = require('../models/SubjectAssignment');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private (Admin/Teacher)
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().lean();
    const formattedSubjects = subjects.map(s => ({
      ...s,
      id: s._id.toString()
    }));

    formattedSubjects.forEach(s => { delete s._id; delete s.__v; });

    res.json(formattedSubjects);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get subject by ID
// @route   GET /api/subjects/:id
// @access  Private (Admin/Teacher)
const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private (Admin only)
const createSubject = async (req, res) => {
  try {
    const { name, shortCode } = req.body;

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ $or: [{ name }, { shortCode }] });
    if (existingSubject) {
      return res.status(400).json({ message: 'Subject with this name or short code already exists' });
    }

    const subject = new Subject({
      name,
      shortCode
    });

    await subject.save();

    res.status(201).json(subject);
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Admin only)
const updateSubject = async (req, res) => {
  try {
    const { name, shortCode } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if new name or shortCode already exists
    if (name && name !== subject.name) {
      const existingSubject = await Subject.findOne({ name });
      if (existingSubject) {
        return res.status(400).json({ message: 'Subject with this name already exists' });
      }
    }

    if (shortCode && shortCode !== subject.shortCode) {
      const existingSubject = await Subject.findOne({ shortCode });
      if (existingSubject) {
        return res.status(400).json({ message: 'Subject with this short code already exists' });
      }
    }

    subject.name = name || subject.name;
    subject.shortCode = shortCode || subject.shortCode;
    subject.updatedAt = new Date();

    await subject.save();

    res.json(subject);
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private (Admin only)
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Delete all assignments for this subject
    await SubjectAssignment.deleteMany({ subjectId: req.params.id });

    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};