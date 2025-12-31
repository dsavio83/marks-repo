const connectDB = require('../config/db');
const examController = require('../controllers/examController');
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
            const { id, classId } = req.query;

            if (req.method === 'GET') {
                // Get exams by class
                if (classId) {
                    req.params = { classId };
                    return await examController.getExamsByClass(req, res);
                }
                // Get exam by ID
                if (id) {
                    req.params = { id };
                    return await examController.getExamById(req, res);
                }
                // Get all exams
                return await examController.getAllExams(req, res);
            } else if (req.method === 'POST') {
                // Create exam - requires teacher/admin
                return teacherAuth(req, res, async () => {
                    return await examController.createExam(req, res);
                });
            } else if (req.method === 'PUT') {
                // Update exam - requires teacher/admin
                return teacherAuth(req, res, async () => {
                    req.params = { id: id || req.body.id };
                    return await examController.updateExam(req, res);
                });
            } else if (req.method === 'DELETE') {
                // Delete exam - requires teacher/admin
                return teacherAuth(req, res, async () => {
                    req.params = { id: id || req.body.id };
                    return await examController.deleteExam(req, res);
                });
            }

            return res.status(405).json({ message: 'Method not allowed' });
        });
    } catch (error) {
        console.error('Exams API error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
