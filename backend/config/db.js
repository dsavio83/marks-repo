const mongoose = require('mongoose');
require('dotenv').config();

// Global variable to cache the connection
let cachedConnection = null;

const connectDB = async () => {
  // If we have a cached connection and it's ready, return it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    // Configure mongoose for serverless environment
    mongoose.set('strictQuery', false);

    // Connection options optimized for serverless
    const options = {
      maxPoolSize: 10, // Limit connection pool size for serverless
      minPoolSize: 0, // Let connections scale down to 0 if unused
      serverSelectionTimeoutMS: 30000, // Timeout after 30s
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      w: 'majority'
    };

    // Connect to MongoDB
    const connection = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log('MongoDB connected successfully');
    console.log(`Database: ${connection.connection.db.databaseName}`);

    // Cache the connection
    cachedConnection = connection;

    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Server will continue running, but database operations will fail.');
    console.error('POSSIBLE CAUSES:');
    console.error('1. Your IP address is not whitelisted in MongoDB Atlas.');
    console.error('2. Incorrect MONGODB_URI in .env file.');
    console.error('3. Network connectivity issues (firewall/VPN).');

    // In serverless, we don't exit the process
    // Return null to indicate connection failure
    return null;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  cachedConnection = null; // Clear cache on disconnect
});

module.exports = connectDB;