const connectDB = require('../config/db');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

module.exports = async (req, res) => {
    // Connect to database
    await connectDB();

    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Route based on method and path
        if (req.method === 'POST') {
            // Check if it's login or register based on URL path
            if (req.url.includes('/login') || req.body?.action === 'login') {
                return await authController.loginUser(req, res);
            } else if (req.url.includes('/register') || req.body?.action === 'register') {
                return await authController.registerUser(req, res);
            }
            return res.status(400).json({ message: 'Invalid action. Use action: "login" or "register"' });
        } else if (req.method === 'GET') {
            // Get profile - requires authentication
            return await auth(req, res, async () => {
                return await authController.getProfile(req, res);
            });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Auth API error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
