const connectDB = require('../config/db');
const app = require('../server');

// This file exports the Express app for Vercel serverless deployment
// We wrap it in an async function to ensure DB connection
module.exports = async (req, res) => {
    console.log(`Vercel API Entry: ${req.method} ${req.url}`);

    try {
        const db = await connectDB();
        if (!db) {
            console.error('Database connection failed in Vercel Entry');
            return res.status(500).json({ message: 'Database connection failed' });
        }

        // Pass request to Express app
        return app(req, res);
    } catch (error) {
        console.error('Vercel API Entry Error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                message: 'Internal Server Error',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
};
