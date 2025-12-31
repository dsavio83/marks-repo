const connectDB = require('../config/db');
const gradeSchemeController = require('../controllers/gradeSchemeController');
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
            const { id, className } = req.query;

            if (req.method === 'GET') {
                // Get grade schemes by class
                if (className) {
                    req.params = { className };
                    return await gradeSchemeController.getGradeSchemesByClass(req, res);
                }
                // Get grade scheme by ID
                if (id) {
                    req.params = { id };
                    return await gradeSchemeController.getGradeSchemeById(req, res);
                }
                // Get all grade schemes
                return await gradeSchemeController.getAllGradeSchemes(req, res);
            } else if (req.method === 'POST') {
                // Create grade scheme - requires admin
                return adminAuth(req, res, async () => {
                    return await gradeSchemeController.createGradeScheme(req, res);
                });
            } else if (req.method === 'PUT') {
                // Update grade scheme - requires admin
                return adminAuth(req, res, async () => {
                    req.params = { id: id || req.body.id };
                    return await gradeSchemeController.updateGradeScheme(req, res);
                });
            } else if (req.method === 'DELETE') {
                // Delete grade scheme - requires admin
                return adminAuth(req, res, async () => {
                    req.params = { id: id || req.body.id };
                    return await gradeSchemeController.deleteGradeScheme(req, res);
                });
            }

            return res.status(405).json({ message: 'Method not allowed' });
        });
    } catch (error) {
        console.error('Grade Schemes API error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
