const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://tamilvizuthukal_db_user:gwCXynzw60X4JOsn@cluster0.8vzoq98.mongodb.net/SmartSchoolPro?retryWrites=true&w=majority';
    
    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB connected successfully');
    
    // Test collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('✓ Available collections:', collections.map(c => c.name));
    
    mongoose.connection.close();
    console.log('✓ Connection closed');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB();