/**
 * Health Check Routes
 * Provides endpoints for monitoring system health
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const redis = require('redis');
const config = require('../config');

// Create Redis client for health check
let redisClient;
try {
  redisClient = redis.createClient({
    url: config.redis.url
  });
  redisClient.on('error', (err) => {
    console.error('Redis health check error:', err);
  });
} catch (err) {
  console.error('Failed to create Redis client for health check:', err);
}

/**
 * Basic health check
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Detailed health check including database and Redis
 */
router.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {}
  };

  let overallStatus = 'healthy';

  // Check database connection
  try {
    if (mongoose.connection.readyState === 1) {
      health.services.database = {
        status: 'healthy',
        connection: 'connected'
      };
    } else {
      health.services.database = {
        status: 'unhealthy',
        connection: 'disconnected'
      };
      overallStatus = 'unhealthy';
    }
  } catch (error) {
    health.services.database = {
      status: 'unhealthy',
      error: error.message
    };
    overallStatus = 'unhealthy';
  }

  // Check Redis connection
  try {
    if (redisClient) {
      await redisClient.connect();
      const pong = await redisClient.ping();
      if (pong === 'PONG') {
        health.services.redis = {
          status: 'healthy',
          connection: 'connected'
        };
      } else {
        health.services.redis = {
          status: 'unhealthy',
          connection: 'failed'
        };
        overallStatus = 'unhealthy';
      }
      await redisClient.disconnect();
    } else {
      health.services.redis = {
        status: 'unhealthy',
        error: 'Redis client not initialized'
      };
      overallStatus = 'unhealthy';
    }
  } catch (error) {
    health.services.redis = {
      status: 'unhealthy',
      error: error.message
    };
    overallStatus = 'unhealthy';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  health.services.memory = {
    status: 'healthy',
    usage: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
    }
  };

  health.status = overallStatus;

  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * Readiness check - indicates if the service is ready to accept traffic
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'Database not connected'
      });
    }

    // Check if Redis is available (optional)
    if (redisClient) {
      try {
        await redisClient.connect();
        await redisClient.ping();
        await redisClient.disconnect();
      } catch (error) {
        return res.status(503).json({
          status: 'not ready',
          reason: 'Redis not available'
        });
      }
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Liveness check - indicates if the service is alive
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;