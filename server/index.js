const express = require('express');
let cors, helmet, rateLimit;

try {
  cors = require('cors');
  helmet = require('helmet');
  rateLimit = require('express-rate-limit');
  require('dotenv').config();
} catch (err) {
  console.log('Some dependencies not available, using minimal setup');
}

// Simple logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`)
};

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
if (helmet) {
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
}

// CORS configuration
if (cors) {
  app.use(cors({
    origin: '*', // Allow all origins for Docker testing
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
}

// Rate limiting
if (rateLimit) {
  const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Try to load routes if available
try {
  // Load health routes if available
  const healthRoutes = require('./routes/health');
  app.use('/api', healthRoutes);
  logger.info('Health routes loaded successfully');
} catch (err) {
  logger.warn('Health routes not available: ' + err.message);
}

try {
  // Load Verifi routes
  const verifiRoutes = require('./routes/verifi');
  app.use('/api/verifi', verifiRoutes);
  logger.info('Verifi routes loaded successfully');
} catch (err) {
  logger.warn('Verifi routes not available: ' + err.message);
}

try {
  // Load existing routes if available
  const authRoutes = require('./routes/auth');
  const tokenRoutes = require('./routes/tokens');
  const rewardsRoutes = require('./routes/rewards');
  const analyticsRoutes = require('./routes/analytics');
  
  app.use('/api/auth', authRoutes);
  app.use('/api/tokens', tokenRoutes);
  app.use('/api/rewards', rewardsRoutes);
  app.use('/api/analytics', analyticsRoutes);
  
  logger.info('Additional routes loaded successfully');
} catch (err) {
  logger.warn('Some additional routes not available: ' + err.message);
}

// API placeholder routes for Docker testing
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    message: 'Verifi AI API is running in Docker container',
    timestamp: new Date().toISOString()
  });
});

// Serve static files if directory exists
try {
  app.use('/uploads', express.static('uploads'));
} catch (err) {
  logger.warn('Static file serving error: ' + err.message);
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Simple error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error: ' + err.message);
  res.status(500).json({
    error: 'Server error',
    message: err.message
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Verifi AI API Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Health check available at: http://localhost:${PORT}/health`);
});

module.exports = app;