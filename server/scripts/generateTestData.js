#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dataGenerator = require('../services/dataGenerator');
const logger = require('../utils/logger');
const knex = require('../config/database');

async function generateTestData() {
  try {
    logger.info('Starting test data generation...');
    
    // Check database connection
    await knex.raw('SELECT 1');
    logger.info('Database connection successful');
    
    // Initialize ML service
    const anomalyDetection = require('../services/ml/anomalyDetection');
    await anomalyDetection.initialize();
    
    // Generate full year of data
    logger.info('Generating comprehensive test data for the last year...');
    const result = await dataGenerator.generateFullYearData();
    
    logger.info('Test data generation completed!');
    logger.info('Summary:', result);
    
    // Generate some ML patterns
    logger.info('Training ML models with generated data...');
    await anomalyDetection.trainModel();
    
    logger.info('All data generation and ML training completed successfully!');
    
    // Show some statistics
    const stats = await getStatistics();
    logger.info('Database Statistics:');
    logger.info(`- Manufacturers: ${stats.manufacturers}`);
    logger.info(`- Products: ${stats.products}`);
    logger.info(`- Users: ${stats.users}`);
    logger.info(`- Tokens: ${stats.tokens}`);
    logger.info(`- Validations: ${stats.validations}`);
    logger.info(`- Counterfeit Reports: ${stats.counterfeits}`);
    logger.info(`- Distribution Channels: ${stats.channels}`);
    logger.info(`- Rewards Available: ${stats.rewards}`);
    
    process.exit(0);
  } catch (error) {
    logger.error('Error generating test data:', error);
    process.exit(1);
  }
}

async function getStatistics() {
  const [
    manufacturers,
    products,
    users,
    tokens,
    validations,
    counterfeits,
    channels,
    rewards
  ] = await Promise.all([
    knex('manufacturers').count('* as count').first(),
    knex('products').count('* as count').first(),
    knex('users').count('* as count').first(),
    knex('nfc_tokens').count('* as count').first(),
    knex('supply_chain_events').where('event_type', 'validation').count('* as count').first(),
    knex('counterfeit_reports').count('* as count').first(),
    knex('distribution_channels').count('* as count').first(),
    knex('rewards_catalog').count('* as count').first()
  ]);
  
  return {
    manufacturers: manufacturers.count,
    products: products.count,
    users: users.count,
    tokens: tokens.count,
    validations: validations.count,
    counterfeits: counterfeits.count,
    channels: channels.count,
    rewards: rewards.count
  };
}

// Run the script
generateTestData();