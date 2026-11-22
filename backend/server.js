const path = require('path');
// Ensure dotenv can find .env if present
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const feeRoutes = require('./routes/feeRoutes');
const menuRoutes = require('./routes/menuRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const rebateRoutes = require('./routes/rebateRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Database connection (graceful, non-fatal on Render boot)
connectDB().catch((err) => {
  console.error('[MongoDB Init Error]:', err.message);
});

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Root endpoint for Render health checks and browser verification
app.get('/', (req, res) => {
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const currentDbState = dbStates[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    status: 'online',
    appName: 'Smart Mess – Hostel Mess Management Portal API',
    version: '1.0.0',
    database: currentDbState,
    dbConnected: mongoose.connection.readyState === 1,
    message: mongoose.connection.readyState === 1
      ? 'Backend and MongoDB are connected and running smoothly!'
      : 'Backend is running. MongoDB is currently not connected. Please verify MONGODB_URI in your Render environment variables and ensure MongoDB Atlas allows 0.0.0.0/0 IP access.',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      students: '/api/students',
      fees: '/api/fees',
      menu: '/api/menu',
      complaints: '/api/complaints',
      rebates: '/api/rebates',
      attendance: '/api/attendance',
      analytics: '/api/analytics',
      notifications: '/api/notifications',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'Smart Mess – Hostel Mess Management Portal API',
    version: '1.0.0',
    databaseReady: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
    istTime: new Date(new Date().getTime() + (new Date().getTimezoneOffset() + 330) * 60000).toLocaleString('en-IN'),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/rebates', rebateRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Explicitly bind to '0.0.0.0' for cloud container compatibility (Render, Railway, Docker)
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Smart Mess Server running on port ${PORT} bound to 0.0.0.0 in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
