const connectDB = require('../config/db');

module.exports = async (req, res) => {
    // Connect to database
    const connection = await connectDB();

    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        const dbStatus = connection ? 'connected' : 'disconnected';

        return res.status(200).json({
            message: 'Smart School Pro Backend API is running',
            status: 'healthy',
            database: dbStatus,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    }

    return res.status(405).json({ message: 'Method not allowed' });
};
