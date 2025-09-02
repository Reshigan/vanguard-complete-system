/**
 * Vanguard Anti-Counterfeiting System - ML Worker
 * 
 * This worker handles machine learning tasks including:
 * - Anomaly detection in verification patterns
 * - Identification of suspicious distribution channels
 * - Tracking of repeat offenders
 * - Pattern analysis for counterfeit detection
 * - Model training and evaluation
 */

const tf = require('@tensorflow/tfjs-node');
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { Validation, Report, Channel, User, Product, MLModel, AnomalyResult } = require('../models');
const logger = require('../utils/logger');

// Connect to database
mongoose.connect(config.database.url, config.database.options)
  .then(() => logger.info('ML Worker connected to database'))
  .catch(err => {
    logger.error('ML Worker database connection error:', err);
    process.exit(1);
  });

// ML Worker configuration
const ML_WORKER_CONFIG = {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password
  },
  concurrency: 2
};

// Model paths
const MODEL_DIR = path.join(__dirname, '../data/models');

// Ensure model directory exists
if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
}

// Load or create models
async function loadOrCreateModel(modelName) {
  const modelPath = path.join(MODEL_DIR, modelName);
  
  try {
    // Check if model exists in database
    const modelRecord = await MLModel.findOne({ name: modelName });
    
    if (modelRecord && modelRecord.status === 'active') {
      // Try to load from filesystem
      if (fs.existsSync(`${modelPath}/model.json`)) {
        logger.info(`Loading model ${modelName} from filesystem`);
        return await tf.loadLayersModel(`file://${modelPath}/model.json`);
      }
    }
    
    // Model doesn't exist or is not active, create a new one
    logger.info(`Creating new model ${modelName}`);
    return createModel(modelName);
  } catch (err) {
    logger.error(`Error loading model ${modelName}:`, err);
    return createModel(modelName);
  }
}

// Create a new model
function createModel(modelName) {
  switch (modelName) {
    case 'anomaly-detection':
      return createAnomalyDetectionModel();
    case 'channel-risk':
      return createChannelRiskModel();
    case 'repeat-offender':
      return createRepeatOffenderModel();
    default:
      throw new Error(`Unknown model type: ${modelName}`);
  }
}

// Create anomaly detection model
function createAnomalyDetectionModel() {
  const model = tf.sequential();
  
  // Input layer
  model.add(tf.layers.dense({
    inputShape: [10], // Feature count
    units: 32,
    activation: 'relu'
  }));
  
  // Hidden layers
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu'
  }));
  
  // Output layer (binary classification: anomaly or not)
  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid'
  }));
  
  // Compile model
  model.compile({
    optimizer: 'adam',
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });
  
  return model;
}

// Create channel risk model
function createChannelRiskModel() {
  const model = tf.sequential();
  
  // Input layer
  model.add(tf.layers.dense({
    inputShape: [8], // Feature count
    units: 24,
    activation: 'relu'
  }));
  
  // Hidden layers
  model.add(tf.layers.dense({
    units: 12,
    activation: 'relu'
  }));
  
  // Output layer (risk score from 0 to 100)
  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid'
  }));
  
  // Compile model
  model.compile({
    optimizer: 'adam',
    loss: 'meanSquaredError',
    metrics: ['mse']
  });
  
  return model;
}

// Create repeat offender model
function createRepeatOffenderModel() {
  const model = tf.sequential();
  
  // Input layer
  model.add(tf.layers.dense({
    inputShape: [12], // Feature count
    units: 32,
    activation: 'relu'
  }));
  
  // Hidden layers
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu'
  }));
  
  // Output layer (probability of being a repeat offender)
  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid'
  }));
  
  // Compile model
  model.compile({
    optimizer: 'adam',
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });
  
  return model;
}

// Save model
async function saveModel(model, modelName) {
  const modelPath = path.join(MODEL_DIR, modelName);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(modelPath)) {
    fs.mkdirSync(modelPath, { recursive: true });
  }
  
  // Save model
  await model.save(`file://${modelPath}`);
  
  // Update or create model record in database
  await MLModel.findOneAndUpdate(
    { name: modelName },
    {
      name: modelName,
      version: Date.now(),
      status: 'active',
      accuracy: 0, // Will be updated after evaluation
      lastTrained: new Date()
    },
    { upsert: true }
  );
  
  logger.info(`Model ${modelName} saved`);
}

// Prepare data for anomaly detection
async function prepareAnomalyData() {
  // Get validation data
  const validations = await Validation.find()
    .populate('user', 'role location')
    .populate('product', 'category price')
    .sort({ createdAt: 1 })
    .lean();
  
  // Get reports
  const reports = await Report.find().lean();
  
  // Create a map of reported validations
  const reportedValidations = new Set();
  reports.forEach(report => {
    if (report.validation) {
      reportedValidations.add(report.validation.toString());
    }
  });
  
  // Process validations into features
  const features = [];
  const labels = [];
  
  // Group validations by user
  const userValidations = {};
  validations.forEach(validation => {
    const userId = validation.user ? validation.user._id.toString() : 'unknown';
    if (!userValidations[userId]) {
      userValidations[userId] = [];
    }
    userValidations[userId].push(validation);
  });
  
  // Process each user's validations
  Object.values(userValidations).forEach(userVals => {
    if (userVals.length < 2) return; // Skip users with only one validation
    
    // Sort by time
    userVals.sort((a, b) => a.createdAt - b.createdAt);
    
    // Process sequential validations
    for (let i = 1; i < userVals.length; i++) {
      const prev = userVals[i-1];
      const curr = userVals[i];
      
      // Calculate time difference in hours
      const timeDiff = (curr.createdAt - prev.createdAt) / (1000 * 60 * 60);
      
      // Skip if more than 24 hours apart
      if (timeDiff > 24) continue;
      
      // Extract features
      const feature = [
        timeDiff, // Time between validations
        prev.result === 'authentic' ? 1 : 0, // Previous result
        curr.result === 'authentic' ? 1 : 0, // Current result
        prev.location && curr.location && 
          prev.location.country === curr.location.country ? 1 : 0, // Same country
        prev.location && curr.location && 
          prev.location.city === curr.location.city ? 1 : 0, // Same city
        prev.product && curr.product && 
          prev.product.category === curr.product.category ? 1 : 0, // Same category
        prev.deviceInfo && curr.deviceInfo && 
          prev.deviceInfo.type === curr.deviceInfo.type ? 1 : 0, // Same device type
        prev.deviceInfo && curr.deviceInfo && 
          prev.deviceInfo.browser === curr.deviceInfo.browser ? 1 : 0, // Same browser
        prev.deviceInfo && curr.deviceInfo && 
          prev.deviceInfo.os === curr.deviceInfo.os ? 1 : 0, // Same OS
        userVals.length / 100 // Normalized validation count
      ];
      
      features.push(feature);
      
      // Label: 1 if reported as counterfeit, 0 otherwise
      const isReported = reportedValidations.has(curr._id.toString());
      labels.push(isReported ? 1 : 0);
    }
  });
  
  return {
    features: tf.tensor2d(features),
    labels: tf.tensor2d(labels, [labels.length, 1])
  };
}

// Prepare data for channel risk model
async function prepareChannelData() {
  // Get channels
  const channels = await Channel.find().lean();
  
  // Get validations
  const validations = await Validation.find().lean();
  
  // Process channels into features
  const features = [];
  const labels = [];
  
  channels.forEach(channel => {
    // Get validations for this channel
    const channelValidations = validations.filter(v => 
      v.product && v.product.channel && 
      v.product.channel.toString() === channel._id.toString()
    );
    
    if (channelValidations.length === 0) return; // Skip channels with no validations
    
    // Calculate metrics
    const totalValidations = channelValidations.length;
    const counterfeitCount = channelValidations.filter(v => v.result === 'counterfeit').length;
    const counterfeitRate = counterfeitCount / totalValidations;
    
    // Get unique products
    const uniqueProducts = new Set();
    channelValidations.forEach(v => {
      if (v.product) uniqueProducts.add(v.product.toString());
    });
    
    // Get unique users
    const uniqueUsers = new Set();
    channelValidations.forEach(v => {
      if (v.user) uniqueUsers.add(v.user.toString());
    });
    
    // Extract features
    const feature = [
      totalValidations / 1000, // Normalized validation count
      counterfeitRate, // Counterfeit rate
      uniqueProducts.size / 100, // Normalized unique product count
      uniqueUsers.size / 100, // Normalized unique user count
      channel.createdAt ? (Date.now() - channel.createdAt) / (1000 * 60 * 60 * 24 * 365) : 0, // Age in years
      channel.region ? 1 : 0, // Has region
      channel.city ? 1 : 0, // Has city
      channel.coordinates ? 1 : 0 // Has coordinates
    ];
    
    features.push(feature);
    
    // Label: normalized risk score (0-1)
    labels.push(channel.riskScore / 100);
  });
  
  return {
    features: tf.tensor2d(features),
    labels: tf.tensor2d(labels, [labels.length, 1])
  };
}

// Prepare data for repeat offender model
async function prepareOffenderData() {
  // Get users
  const users = await User.find().lean();
  
  // Get validations
  const validations = await Validation.find().lean();
  
  // Get reports
  const reports = await Report.find()
    .populate('validation')
    .lean();
  
  // Process users into features
  const features = [];
  const labels = [];
  
  users.forEach(user => {
    // Get validations for this user
    const userValidations = validations.filter(v => 
      v.user && v.user.toString() === user._id.toString()
    );
    
    if (userValidations.length === 0) return; // Skip users with no validations
    
    // Get reports related to this user
    const userReports = reports.filter(r => 
      r.validation && r.validation.user && 
      r.validation.user.toString() === user._id.toString()
    );
    
    // Calculate metrics
    const totalValidations = userValidations.length;
    const counterfeitCount = userValidations.filter(v => v.result === 'counterfeit').length;
    const counterfeitRate = counterfeitCount / totalValidations;
    
    const confirmedReports = userReports.filter(r => r.status === 'confirmed').length;
    const rejectedReports = userReports.filter(r => r.status === 'rejected').length;
    
    // Get unique products
    const uniqueProducts = new Set();
    userValidations.forEach(v => {
      if (v.product) uniqueProducts.add(v.product.toString());
    });
    
    // Get unique locations
    const uniqueLocations = new Set();
    userValidations.forEach(v => {
      if (v.location && v.location.city) {
        uniqueLocations.add(`${v.location.country}-${v.location.city}`);
      }
    });
    
    // Extract features
    const feature = [
      totalValidations / 100, // Normalized validation count
      counterfeitRate, // Counterfeit rate
      confirmedReports / Math.max(1, userReports.length), // Confirmed report rate
      rejectedReports / Math.max(1, userReports.length), // Rejected report rate
      uniqueProducts.size / 50, // Normalized unique product count
      uniqueLocations.size / 10, // Normalized unique location count
      user.createdAt ? (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24 * 365) : 0, // Age in years
      user.role === 'consumer' ? 1 : 0, // Is consumer
      user.role === 'retailer' ? 1 : 0, // Is retailer
      user.role === 'distributor' ? 1 : 0, // Is distributor
      user.role === 'manufacturer' ? 1 : 0, // Is manufacturer
      user.points ? user.points / 5000 : 0 // Normalized points
    ];
    
    features.push(feature);
    
    // Label: 1 if repeat offender (multiple counterfeit validations), 0 otherwise
    const isRepeatOffender = counterfeitCount >= 3;
    labels.push(isRepeatOffender ? 1 : 0);
  });
  
  return {
    features: tf.tensor2d(features),
    labels: tf.tensor2d(labels, [labels.length, 1])
  };
}

// Train anomaly detection model
async function trainAnomalyModel() {
  logger.info('Training anomaly detection model...');
  
  // Load or create model
  const model = await loadOrCreateModel('anomaly-detection');
  
  // Prepare data
  const { features, labels } = await prepareAnomalyData();
  
  // Train model
  const history = await model.fit(features, labels, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        logger.info(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
      }
    }
  });
  
  // Evaluate model
  const evaluation = await model.evaluate(features, labels);
  const accuracy = evaluation[1].dataSync()[0];
  
  logger.info(`Anomaly detection model trained with accuracy: ${accuracy.toFixed(4)}`);
  
  // Save model
  await saveModel(model, 'anomaly-detection');
  
  // Update model record with accuracy
  await MLModel.findOneAndUpdate(
    { name: 'anomaly-detection' },
    { accuracy: accuracy }
  );
  
  return { accuracy, history };
}

// Train channel risk model
async function trainChannelRiskModel() {
  logger.info('Training channel risk model...');
  
  // Load or create model
  const model = await loadOrCreateModel('channel-risk');
  
  // Prepare data
  const { features, labels } = await prepareChannelData();
  
  // Train model
  const history = await model.fit(features, labels, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        logger.info(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, mse = ${logs.mse.toFixed(4)}`);
      }
    }
  });
  
  // Evaluate model
  const evaluation = await model.evaluate(features, labels);
  const mse = evaluation[1].dataSync()[0];
  const accuracy = 1 - Math.sqrt(mse); // Approximate accuracy from MSE
  
  logger.info(`Channel risk model trained with accuracy: ${accuracy.toFixed(4)}`);
  
  // Save model
  await saveModel(model, 'channel-risk');
  
  // Update model record with accuracy
  await MLModel.findOneAndUpdate(
    { name: 'channel-risk' },
    { accuracy: accuracy }
  );
  
  return { accuracy, history };
}

// Train repeat offender model
async function trainRepeatOffenderModel() {
  logger.info('Training repeat offender model...');
  
  // Load or create model
  const model = await loadOrCreateModel('repeat-offender');
  
  // Prepare data
  const { features, labels } = await prepareOffenderData();
  
  // Train model
  const history = await model.fit(features, labels, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        logger.info(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
      }
    }
  });
  
  // Evaluate model
  const evaluation = await model.evaluate(features, labels);
  const accuracy = evaluation[1].dataSync()[0];
  
  logger.info(`Repeat offender model trained with accuracy: ${accuracy.toFixed(4)}`);
  
  // Save model
  await saveModel(model, 'repeat-offender');
  
  // Update model record with accuracy
  await MLModel.findOneAndUpdate(
    { name: 'repeat-offender' },
    { accuracy: accuracy }
  );
  
  return { accuracy, history };
}

// Detect anomalies in recent validations
async function detectAnomalies() {
  logger.info('Detecting anomalies in recent validations...');
  
  // Load model
  const model = await loadOrCreateModel('anomaly-detection');
  
  // Get recent validations (last 24 hours)
  const recentDate = new Date();
  recentDate.setHours(recentDate.getHours() - 24);
  
  const validations = await Validation.find({ createdAt: { $gte: recentDate } })
    .populate('user', 'role location')
    .populate('product', 'category price')
    .sort({ createdAt: 1 })
    .lean();
  
  logger.info(`Found ${validations.length} recent validations`);
  
  // Group validations by user
  const userValidations = {};
  validations.forEach(validation => {
    const userId = validation.user ? validation.user._id.toString() : 'unknown';
    if (!userValidations[userId]) {
      userValidations[userId] = [];
    }
    userValidations[userId].push(validation);
  });
  
  // Process each user's validations
  const anomalies = [];
  
  await Promise.all(Object.entries(userValidations).map(async ([userId, userVals]) => {
    if (userVals.length < 2) return; // Skip users with only one validation
    
    // Sort by time
    userVals.sort((a, b) => a.createdAt - b.createdAt);
    
    // Process sequential validations
    for (let i = 1; i < userVals.length; i++) {
      const prev = userVals[i-1];
      const curr = userVals[i];
      
      // Calculate time difference in hours
      const timeDiff = (curr.createdAt - prev.createdAt) / (1000 * 60 * 60);
      
      // Skip if more than 24 hours apart
      if (timeDiff > 24) continue;
      
      // Extract features
      const feature = [
        timeDiff, // Time between validations
        prev.result === 'authentic' ? 1 : 0, // Previous result
        curr.result === 'authentic' ? 1 : 0, // Current result
        prev.location && curr.location && 
          prev.location.country === curr.location.country ? 1 : 0, // Same country
        prev.location && curr.location && 
          prev.location.city === curr.location.city ? 1 : 0, // Same city
        prev.product && curr.product && 
          prev.product.category === curr.product.category ? 1 : 0, // Same category
        prev.deviceInfo && curr.deviceInfo && 
          prev.deviceInfo.type === curr.deviceInfo.type ? 1 : 0, // Same device type
        prev.deviceInfo && curr.deviceInfo && 
          prev.deviceInfo.browser === curr.deviceInfo.browser ? 1 : 0, // Same browser
        prev.deviceInfo && curr.deviceInfo && 
          prev.deviceInfo.os === curr.deviceInfo.os ? 1 : 0, // Same OS
        userVals.length / 100 // Normalized validation count
      ];
      
      // Predict anomaly
      const prediction = model.predict(tf.tensor2d([feature]));
      const anomalyScore = prediction.dataSync()[0];
      
      // If anomaly score is high, record it
      if (anomalyScore > 0.7) {
        anomalies.push({
          validation: curr._id,
          user: curr.user ? curr.user._id : null,
          product: curr.product ? curr.product._id : null,
          score: anomalyScore,
          type: 'validation-pattern',
          details: {
            timeDiff,
            previousResult: prev.result,
            currentResult: curr.result,
            location: curr.location
          },
          createdAt: new Date()
        });
      }
    }
  }));
  
  // Save anomalies to database
  if (anomalies.length > 0) {
    await AnomalyResult.insertMany(anomalies);
    logger.info(`Detected ${anomalies.length} anomalies`);
  } else {
    logger.info('No anomalies detected');
  }
  
  return anomalies;
}

// Update channel risk scores
async function updateChannelRiskScores() {
  logger.info('Updating channel risk scores...');
  
  // Load model
  const model = await loadOrCreateModel('channel-risk');
  
  // Get all channels
  const channels = await Channel.find().lean();
  
  // Get validations
  const validations = await Validation.find().lean();
  
  // Process channels
  const updates = [];
  
  for (const channel of channels) {
    // Get validations for this channel
    const channelValidations = validations.filter(v => 
      v.product && v.product.channel && 
      v.product.channel.toString() === channel._id.toString()
    );
    
    if (channelValidations.length === 0) continue; // Skip channels with no validations
    
    // Calculate metrics
    const totalValidations = channelValidations.length;
    const counterfeitCount = channelValidations.filter(v => v.result === 'counterfeit').length;
    const counterfeitRate = counterfeitCount / totalValidations;
    
    // Get unique products
    const uniqueProducts = new Set();
    channelValidations.forEach(v => {
      if (v.product) uniqueProducts.add(v.product.toString());
    });
    
    // Get unique users
    const uniqueUsers = new Set();
    channelValidations.forEach(v => {
      if (v.user) uniqueUsers.add(v.user.toString());
    });
    
    // Extract features
    const feature = [
      totalValidations / 1000, // Normalized validation count
      counterfeitRate, // Counterfeit rate
      uniqueProducts.size / 100, // Normalized unique product count
      uniqueUsers.size / 100, // Normalized unique user count
      channel.createdAt ? (Date.now() - channel.createdAt) / (1000 * 60 * 60 * 24 * 365) : 0, // Age in years
      channel.region ? 1 : 0, // Has region
      channel.city ? 1 : 0, // Has city
      channel.coordinates ? 1 : 0 // Has coordinates
    ];
    
    // Predict risk score
    const prediction = model.predict(tf.tensor2d([feature]));
    const riskScore = Math.round(prediction.dataSync()[0] * 100);
    
    // Update channel
    updates.push({
      updateOne: {
        filter: { _id: channel._id },
        update: { 
          $set: { 
            riskScore,
            status: riskScore > 70 ? 'flagged' : 'active'
          }
        }
      }
    });
  }
  
  // Apply updates
  if (updates.length > 0) {
    await Channel.bulkWrite(updates);
    logger.info(`Updated risk scores for ${updates.length} channels`);
  } else {
    logger.info('No channel risk scores updated');
  }
  
  return updates.length;
}

// Identify repeat offenders
async function identifyRepeatOffenders() {
  logger.info('Identifying repeat offenders...');
  
  // Load model
  const model = await loadOrCreateModel('repeat-offender');
  
  // Get users
  const users = await User.find().lean();
  
  // Get validations
  const validations = await Validation.find().lean();
  
  // Get reports
  const reports = await Report.find()
    .populate('validation')
    .lean();
  
  // Process users
  const offenders = [];
  
  for (const user of users) {
    // Get validations for this user
    const userValidations = validations.filter(v => 
      v.user && v.user.toString() === user._id.toString()
    );
    
    if (userValidations.length < 3) continue; // Skip users with few validations
    
    // Get reports related to this user
    const userReports = reports.filter(r => 
      r.validation && r.validation.user && 
      r.validation.user.toString() === user._id.toString()
    );
    
    // Calculate metrics
    const totalValidations = userValidations.length;
    const counterfeitCount = userValidations.filter(v => v.result === 'counterfeit').length;
    const counterfeitRate = counterfeitCount / totalValidations;
    
    const confirmedReports = userReports.filter(r => r.status === 'confirmed').length;
    const rejectedReports = userReports.filter(r => r.status === 'rejected').length;
    
    // Get unique products
    const uniqueProducts = new Set();
    userValidations.forEach(v => {
      if (v.product) uniqueProducts.add(v.product.toString());
    });
    
    // Get unique locations
    const uniqueLocations = new Set();
    userValidations.forEach(v => {
      if (v.location && v.location.city) {
        uniqueLocations.add(`${v.location.country}-${v.location.city}`);
      }
    });
    
    // Extract features
    const feature = [
      totalValidations / 100, // Normalized validation count
      counterfeitRate, // Counterfeit rate
      confirmedReports / Math.max(1, userReports.length), // Confirmed report rate
      rejectedReports / Math.max(1, userReports.length), // Rejected report rate
      uniqueProducts.size / 50, // Normalized unique product count
      uniqueLocations.size / 10, // Normalized unique location count
      user.createdAt ? (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24 * 365) : 0, // Age in years
      user.role === 'consumer' ? 1 : 0, // Is consumer
      user.role === 'retailer' ? 1 : 0, // Is retailer
      user.role === 'distributor' ? 1 : 0, // Is distributor
      user.role === 'manufacturer' ? 1 : 0, // Is manufacturer
      user.points ? user.points / 5000 : 0 // Normalized points
    ];
    
    // Predict if repeat offender
    const prediction = model.predict(tf.tensor2d([feature]));
    const offenderScore = prediction.dataSync()[0];
    
    // If score is high, record as offender
    if (offenderScore > 0.8) {
      offenders.push({
        user: user._id,
        score: offenderScore,
        type: 'repeat-offender',
        details: {
          validationCount: totalValidations,
          counterfeitCount,
          counterfeitRate,
          confirmedReports,
          rejectedReports,
          uniqueProductCount: uniqueProducts.size,
          uniqueLocationCount: uniqueLocations.size
        },
        createdAt: new Date()
      });
    }
  }
  
  // Save offenders to database
  if (offenders.length > 0) {
    await AnomalyResult.insertMany(offenders);
    logger.info(`Identified ${offenders.length} repeat offenders`);
  } else {
    logger.info('No repeat offenders identified');
  }
  
  return offenders;
}

// Create ML worker
const mlWorker = new Worker('ml-jobs', async job => {
  logger.info(`Processing ML job: ${job.name}`);
  
  try {
    switch (job.name) {
      case 'train-anomaly-model':
        return await trainAnomalyModel();
      
      case 'train-channel-risk-model':
        return await trainChannelRiskModel();
      
      case 'train-repeat-offender-model':
        return await trainRepeatOffenderModel();
      
      case 'detect-anomalies':
        return await detectAnomalies();
      
      case 'update-channel-risk-scores':
        return await updateChannelRiskScores();
      
      case 'identify-repeat-offenders':
        return await identifyRepeatOffenders();
      
      case 'train-all-models':
        const results = {};
        results.anomaly = await trainAnomalyModel();
        results.channelRisk = await trainChannelRiskModel();
        results.repeatOffender = await trainRepeatOffenderModel();
        return results;
      
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  } catch (err) {
    logger.error(`Error processing ML job ${job.name}:`, err);
    throw err;
  }
}, ML_WORKER_CONFIG);

// Log worker events
mlWorker.on('completed', job => {
  logger.info(`ML job ${job.id} completed successfully`);
});

mlWorker.on('failed', (job, err) => {
  logger.error(`ML job ${job.id} failed:`, err);
});

logger.info('ML Worker started');

// Export worker for testing
module.exports = mlWorker;