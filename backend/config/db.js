const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mess';
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ [MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ [MongoDB Connection Error]: ${error.message}`);
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️ [MongoDB Warning]: MONGODB_URI environment variable is not defined.');
      console.warn('⚠️ If running on Render, add MONGODB_URI to your Render Environment Variables (e.g., your MongoDB Atlas connection string).');
    } else {
      console.warn('⚠️ Please ensure MongoDB is reachable and that MongoDB Atlas Network Access allows connections (IP: 0.0.0.0/0).');
    }
    // Return null instead of throwing an unhandled rejection, keeping the Express server alive on Render
    return null;
  }
};

module.exports = connectDB;
