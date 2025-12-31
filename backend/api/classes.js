const connectDB = require('../config/db');
const classController = require('../controllers/classController');
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
            const { id, subjects } = req.query;

            if (req.method === 'GET') {
                // Get class subjects
                if (subjects === 'true' && id) {
                    req.params = { id };
                    return await classController.getClassSubjects(req, res);
                }
                // Get class by ID
                if (id) {
                    req.params = { id };
                    return await classController.getClassById(req, res);
                }
                // Get all classes
                return await classController.getAllClasses(req, res);
            } else if (req.method === 'POST') {
                // Create class - requires admin
                return adminAuth(req, res, async () => {
                    return await classController.createClass(req, res);
                });
            } else if (req.method === 'PUT') {
                // Update class - requires admin
                return adminAuth(req, res, async () => {
                    req.params = { id: id || req.body.id };
                    return await classController.updateClass(req, res);
                });
            } else if (req.method === 'DELETE') {
                // Delete class - requires admin
                return adminAuth(req, res, async () => {
                    req.params = { id: id || req.body.id };
                    return await classController.deleteClass(req, res);
                });
            }

            return res.status(405).json({ message: 'Method not allowed' });
        });
    } catch (error) {
        console.error('Classes API error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
