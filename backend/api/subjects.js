const connectDB = require('../config/db');
const subjectController = require('../controllers/subjectController');
const { auth, adminAuth } = require('../middleware/auth');

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
            const { id } = req.query;

            if (req.method === 'GET') {
                // Get subject by ID
                if (id) {
                    req.params = { id };
                    return await subjectController.getSubjectById(req, res);
                }
                // Get all subjects
                return await subjectController.getAllSubjects(req, res);
            } else if (req.method === 'POST') {
                // Create subject - requires admin
                return adminAuth(req, res, async () => {
                    return await subjectController.createSubject(req, res);
                });
            } else if (req.method === 'PUT') {
                // Update subject - requires admin
                return adminAuth(req, res, async () => {
                    req.params = { id: id || req.body.id };
                    return await subjectController.updateSubject(req, res);
                });
            } else if (req.method === 'DELETE') {
                // Delete subject - requires admin
                return adminAuth(req, res, async () => {
                    req.params = { id: id || req.body.id };
                    return await subjectController.deleteSubject(req, res);
                });
            }

            return res.status(405).json({ message: 'Method not allowed' });
        });
    } catch (error) {
        console.error('Subjects API error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
