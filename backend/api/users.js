const connectDB = require('../config/db');
const userController = require('../controllers/userController');
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
            const { id, classId } = req.query;

            if (req.method === 'GET') {
                // Get students by class
                if (classId) {
                    return await userController.getStudentsByClass(req, res);
                }
                // Get user by ID
                if (id) {
                    req.params = { id };
                    return await userController.getUserById(req, res);
                }
                // Get all users
                return await userController.getAllUsers(req, res);
            } else if (req.method === 'PUT') {
                // Update user - requires admin
                return adminAuth(req, res, async () => {
                    req.params = { id: id || req.body.id };
                    return await userController.updateUser(req, res);
                });
            } else if (req.method === 'DELETE') {
                // Delete user - requires admin
                return adminAuth(req, res, async () => {
                    req.params = { id: id || req.body.id };
                    return await userController.deleteUser(req, res);
                });
            }

            return res.status(405).json({ message: 'Method not allowed' });
        });
    } catch (error) {
        console.error('Users API error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
