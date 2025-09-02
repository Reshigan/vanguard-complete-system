/**
 * Vanguard Anti-Counterfeiting System - ML Jobs Trigger
 * 
 * This script triggers ML jobs for:
 * - Anomaly detection
 * - Channel risk assessment
 * - Repeat offender identification
 * - Model training (weekly)
 * 
 * It is designed to be run as a cron job.
 */

const { Queue } = require('bullmq');
const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

// Connect to database
mongoose.connect(config.database.url, config.database.options)
  .then(() => logger.info('Connected to database'))
  .catch(err => {
    logger.error('Database connection error:', err);
    process.exit(1);
  });

// Queue configuration
const queueConfig = {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password
  }
};

// Create ML jobs queue
const mlQueue = new Queue('ml-jobs', queueConfig);

// Check if it's time for weekly model training
const isTrainingDay = () => {
  // Train models on Sunday
  return new Date().getDay() === 0;
};

// Main function
async function main() {
  try {
    logger.info('Triggering ML jobs...');
    
    // Daily jobs
    await mlQueue.add('detect-anomalies', {}, { 
      removeOnComplete: true,
      removeOnFail: 1000
    });
    logger.info('Added anomaly detection job');
    
    await mlQueue.add('update-channel-risk-scores', {}, { 
      removeOnComplete: true,
      removeOnFail: 1000
    });
    logger.info('Added channel risk assessment job');
    
    await mlQueue.add('identify-repeat-offenders', {}, { 
      removeOnComplete: true,
      removeOnFail: 1000
    });
    logger.info('Added repeat offender identification job');
    
    // Weekly model training
    if (isTrainingDay()) {
      logger.info('It\'s training day! Adding model training jobs...');
      
      await mlQueue.add('train-all-models', {}, { 
        removeOnComplete: true,
        removeOnFail: 1000
      });
      logger.info('Added model training job');
    }
    
    logger.info('All ML jobs triggered successfully');
    
    // Close connections
    await mlQueue.close();
    await mongoose.disconnect();
    
    process.exit(0);
  } catch (err) {
    logger.error('Error triggering ML jobs:', err);
    process.exit(1);
  }
}

// Run main function
main();