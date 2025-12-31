const mongoose = require('mongoose');
const Mark = require('../models/Mark');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const SchoolDetails = require('../models/SchoolDetails');
const { generateAnalysis } = require('../services/geminiService');

// @desc    Get all marks
// @route   GET /api/marks
// @access  Private (Admin/Teacher)
const getAllMarks = async (req, res) => {
  try {
    const marks = await Mark.find()
      .populate('studentId', 'name username admissionNo')
      .populate('subjectId', 'name shortCode')
      .populate('examId', 'name');
    res.json(marks);
  } catch (error) {
    console.error('Get marks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get marks by exam
// @route   GET /api/marks/exam/:examId
// @access  Private (Admin/Teacher)
const getMarksByExam = async (req, res) => {
  try {
    const marks = await Mark.find({ examId: req.params.examId })
      .populate('studentId', 'name username admissionNo')
      .populate('subjectId', 'name shortCode')
      .populate('examId', 'name');
    res.json(marks);
  } catch (error) {
    console.error('Get marks by exam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get marks by student
// @route   GET /api/marks/student/:studentId
// @access  Private (Admin/Teacher/Student)
const getMarksByStudent = async (req, res) => {
  try {
    const marks = await Mark.find({ studentId: req.params.studentId })
      .populate('subjectId', 'name shortCode')
      .populate('examId', 'name');
    res.json(marks);
  } catch (error) {
    console.error('Get marks by student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



// @desc    Create or update mark record (Upsert)
// @route   POST /api/marks
// @access  Private (Admin/Teacher/Student)
const createMark = async (req, res) => {
  try {
    const { studentId, subjectId, examId, teMark, ceMark, detailedMarks, isLocked, aiAnalysis, aiAdvice } = req.body;

    // Validate ObjectIDs
    if (!mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Role check: If student is entering marks, they can only enter their own and only if not already locked
    if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Not authorized to enter marks for other students' });
    }

    // Check if record exists and if it's locked
    const existingMark = await Mark.findOne({ studentId, subjectId, examId });
    if (existingMark && existingMark.isLocked && req.user.role === 'STUDENT') {
      return res.status(403).json({ message: 'Mark record is locked and cannot be edited by student' });
    }

    // Prepare update object
    const update = { updatedAt: new Date() };
    if (teMark !== undefined) update.teMark = teMark;
    if (ceMark !== undefined) update.ceMark = ceMark;
    if (detailedMarks !== undefined) {
      update.detailedMarks = detailedMarks;
    }
    if (isLocked !== undefined) update.isLocked = isLocked;
    if (aiAnalysis !== undefined) update.aiAnalysis = aiAnalysis;
    if (aiAdvice !== undefined) update.aiAdvice = aiAdvice;

    // UPSERT LOGIC
    const mark = await Mark.findOneAndUpdate(
      { studentId, subjectId, examId },
      { $set: update },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );

    res.status(mark.createdAt.getTime() === mark.updatedAt.getTime() ? 201 : 200).json({
      message: 'Mark recorded successfully',
      mark: mark
    });

  } catch (error) {
    console.error('Create/Update mark error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update mark record
// @route   PUT /api/marks/:id
// @access  Private (Admin/Teacher)
const updateMark = async (req, res) => {
  try {
    const { teMark, ceMark, detailedMarks, isLocked, aiAnalysis, aiAdvice } = req.body;

    const mark = await Mark.findById(req.params.id);
    if (!mark) {
      return res.status(404).json({ message: 'Mark not found' });
    }

    // Role check: If student is updating, they can only update if not locked
    if (req.user.role === 'STUDENT' && (mark.isLocked || mark.studentId.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to edit this mark' });
    }

    if (teMark !== undefined) mark.teMark = teMark;
    if (ceMark !== undefined) mark.ceMark = ceMark;
    if (detailedMarks !== undefined) mark.detailedMarks = detailedMarks;
    if (isLocked !== undefined) mark.isLocked = isLocked;
    if (aiAnalysis !== undefined) mark.aiAnalysis = aiAnalysis;
    if (aiAdvice !== undefined) mark.aiAdvice = aiAdvice;

    mark.updatedAt = new Date();
    await mark.save();

    res.json({
      message: 'Mark updated successfully',
      mark: mark
    });
  } catch (error) {
    console.error('Update mark error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Analyze mark with Gemini AI
// @route   POST /api/marks/:id/analyze
// @access  Private (Admin/Teacher)
const analyzeMarkWithAI = async (req, res) => {
  try {
    const mark = await Mark.findById(req.params.id)
      .populate('studentId', 'name')
      .populate('subjectId', 'name')
      .populate('examId', 'name');

    if (!mark) {
      return res.status(404).json({ message: 'Mark record not found' });
    }

    const exam = await Exam.findById(mark.examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const subjectConfig = exam.subjectConfigs.find(c => c.subjectId.toString() === mark.subjectId._id.toString());
    if (!subjectConfig) return res.status(400).json({ message: 'Subject not configured for this exam' });

    // Fetch school details for languages
    const school = await SchoolDetails.findOne();
    const languages = (school?.reportLanguages && school.reportLanguages.length > 0)
      ? school.reportLanguages
      : ['English', 'Tamil'];

    // Construct performance data for prompt
    let performanceData = "";
    if (subjectConfig.markSections && subjectConfig.markSections.length > 0) {
      performanceData = mark.detailedMarks.map(dm => {
        const section = subjectConfig.markSections.id(dm.sectionId);
        if (!section) return "";
        const percentage = (dm.marks / section.maxMarks) * 100;
        return `${section.name} (${section.markValue} marks): ${dm.marks}/${section.maxMarks} (${percentage.toFixed(1)}%)`;
      }).filter(Boolean).join('\n');
    }

    const totalTE = parseFloat(mark.teMark) || 0;
    const maxTE = subjectConfig.maxTe;
    const totalPercentage = (totalTE / maxTE) * 100;

    const result = await generateAnalysis({
      studentName: mark.studentId.name,
      subjectName: mark.subjectId.name,
      examName: mark.examId.name,
      totalObtained: totalTE,
      totalMax: maxTE,
      percentage: totalPercentage,
      performanceData: performanceData || "N/A (No detailed sections provided)"
    }, languages);

    // Update mark record with AI results
    mark.aiAnalysis = result.analysis;
    mark.aiAdvice = result.advice;
    await mark.save();

    res.json(result);
  } catch (error) {
    console.error('AI Analysis error:', error);
    res.status(500).json({ message: 'AI Analysis failed' });
  }
};

// @desc    Delete mark record
// @route   DELETE /api/marks/:id
// @access  Private (Admin/Teacher)
const deleteMark = async (req, res) => {
  try {
    const mark = await Mark.findById(req.params.id);
    if (!mark) {
      return res.status(404).json({ message: 'Mark not found' });
    }

    await Mark.findByIdAndDelete(req.params.id);
    res.json({ message: 'Mark deleted successfully' });
  } catch (error) {
    console.error('Delete mark error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get marks by student and exam
// @route   GET /api/marks/student/:studentId/exam/:examId
// @access  Private (Admin/Teacher/Student)
const getMarksByStudentAndExam = async (req, res) => {
  try {
    const marks = await Mark.find({
      studentId: req.params.studentId,
      examId: req.params.examId
    })
      .populate('subjectId', 'name shortCode')
      .populate('examId', 'name');
    res.json(marks);
  } catch (error) {
    console.error('Get marks by student and exam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllMarks,
  getMarksByExam,
  getMarksByStudent,
  createMark,
  updateMark,
  deleteMark,
  getMarksByStudentAndExam,
  analyzeMarkWithAI
};