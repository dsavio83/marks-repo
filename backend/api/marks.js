const connectDB = require('../config/db');
const markController = require('../controllers/markController');
const { auth, teacherAuth } = require('../middleware/auth');

module.exports = async (req, res) => {
    // Connect to database
    await connectDB();

    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // First authenticate the user
        return await auth(req, res, async () => {
            const { id, examId, studentId } = req.query;

            if (req.method === 'GET') {
                // Get marks by student and exam
                if (studentId && examId) {
                    req.params = { studentId, examId };
                    return await markController.getMarksByStudentAndExam(req, res);
                }
                // Get marks by exam
                if (examId) {
                    req.params = { examId };
                    return await markController.getMarksByExam(req, res);
                }
                // Get marks by student
                if (studentId) {
                    req.params = { studentId };
                    return await markController.getMarksByStudent(req, res);
                }
                // Get all marks
                return await markController.getAllMarks(req, res);
            } else if (req.method === 'POST') {
                // Create mark - requires teacher/admin
                return teacherAuth(req, res, async () => {
                    return await markController.createMark(req, res);
                });
            } else if (req.method === 'PUT') {
                // Update mark - requires teacher/admin
                return teacherAuth(req, res, async () => {
                    req.params = { id: id || req.body.id };
                    return await markController.updateMark(req, res);
                });
            } else if (req.method === 'DELETE') {
                // Delete mark - requires teacher/admin
                return teacherAuth(req, res, async () => {
                    req.params = { id: id || req.body.id };
                    return await markController.deleteMark(req, res);
                });
            }

            return res.status(405).json({ message: 'Method not allowed' });
        });
    } catch (error) {
        console.error('Marks API error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
