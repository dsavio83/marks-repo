const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Exam = require('../models/Exam');

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private (Admin/Teacher)
const getAllAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find()
            .populate('studentId', 'name username admissionNo')
            .populate('examId', 'name')
            .lean(); // Use lean for performance and to avoid CastErrors on bad data

        // Filter out any records where student or exam is missing (unlikely if referential integrity is kept, but safe)
        const validAttendance = attendance.filter(a => a.studentId && a.examId)
            .map(a => ({
                ...a,
                id: a._id.toString(),
                studentId: {
                    ...a.studentId,
                    id: a.studentId._id ? a.studentId._id.toString() : ''
                },
                examId: {
                    ...a.examId,
                    id: a.examId._id ? a.examId._id.toString() : ''
                }
            }));

        // Clean up _id
        validAttendance.forEach(a => {
            delete a._id;
            delete a.__v;
            if (a.studentId) { delete a.studentId._id; }
            if (a.examId) { delete a.examId._id; }
        });

        res.json(validAttendance);
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



// @desc    Upsert attendance record
// @route   POST /api/attendance
// @access  Private (Admin/Teacher)
const upsertAttendance = async (req, res) => {
    try {
        const { studentId, examId, percentage } = req.body;

        // Validate ObjectIDs
        if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(examId)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        // Validate student exists
        const student = await User.findById(studentId);
        if (!student || student.role !== 'STUDENT') {
            return res.status(400).json({ message: 'Invalid student' });
        }

        // Validate exam exists
        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Upsert record
        const attendance = await Attendance.findOneAndUpdate(
            { studentId, examId },
            { percentage, updatedAt: new Date() },
            { new: true, upsert: true, runValidators: true }
        );

        res.json({
            message: 'Attendance recorded successfully',
            attendance: {
                id: attendance._id,
                studentId: attendance.studentId,
                examId: attendance.examId,
                percentage: attendance.percentage
            }
        });
    } catch (error) {
        console.error('Upsert attendance error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join(', ') });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: `Invalid value for ${error.path}` });
        }
        res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private (Admin/Teacher)
const deleteAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findByIdAndDelete(req.params.id);
        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }
        res.json({ message: 'Attendance record deleted successfully' });
    } catch (error) {
        console.error('Delete attendance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllAttendance,
    upsertAttendance,
    deleteAttendance
};
