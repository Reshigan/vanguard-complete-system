const tf = require('@tensorflow/tfjs-node');
const knex = require('../../config/database');
const logger = require('../../utils/logger');

class AnomalyDetectionService {
  constructor() {
    this.model = null;
    this.threshold = 0.85; // Configurable threshold for anomaly detection
  }

  async initialize() {
    try {
      // Load or create the model
      await this.loadOrCreateModel();
      logger.info('Anomaly detection service initialized');
    } catch (error) {
      logger.error('Failed to initialize anomaly detection service:', error);
    }
  }

  async loadOrCreateModel() {
    try {
      // Try to load existing model
      const modelData = await knex('ml_models')
        .where({ model_type: 'anomaly_detection', is_active: true })
        .orderBy('created_at', 'desc')
        .first();

      if (modelData) {
        // Load model from saved state
        this.model = await tf.loadLayersModel(`file://./models/${modelData.id}/model.json`);
        logger.info('Loaded existing anomaly detection model');
      } else {
        // Create new model
        this.model = this.createAutoencoder();
        await this.trainModel();
      }
    } catch (error) {
      logger.error('Error loading model:', error);
      this.model = this.createAutoencoder();
    }
  }

  createAutoencoder() {
    const encoder = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [20], units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 4, activation: 'relu' })
      ]
    });

    const decoder = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 20, activation: 'sigmoid' })
      ]
    });

    const autoencoder = tf.sequential({
      layers: [...encoder.layers, ...decoder.layers]
    });

    autoencoder.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });

    return autoencoder;
  }

  async trainModel() {
    try {
      // Get training data
      const trainingData = await this.prepareTrainingData();
      
      if (trainingData.length === 0) {
        logger.warn('No training data available for anomaly detection');
        return;
      }

      const xs = tf.tensor2d(trainingData);
      
      // Train the autoencoder
      await this.model.fit(xs, xs, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              logger.info(`Epoch ${epoch}: loss = ${logs.loss}`);
            }
          }
        }
      });

      // Save model
      const modelId = require('uuid').v4();
      await this.model.save(`file://./models/${modelId}/model.json`);
      
      // Update database
      await knex('ml_models').insert({
        id: modelId,
        model_name: 'Anomaly Detection Autoencoder',
        model_type: 'anomaly_detection',
        version: '1.0.0',
        parameters: { threshold: this.threshold },
        metrics: { trained_samples: trainingData.length },
        is_active: true,
        trained_at: new Date()
      });

      xs.dispose();
      logger.info('Anomaly detection model trained successfully');
    } catch (error) {
      logger.error('Error training model:', error);
    }
  }

  async prepareTrainingData() {
    // Prepare feature vectors from normal behavior patterns
    const normalPatterns = await knex('supply_chain_events')
      .join('nfc_tokens', 'supply_chain_events.token_id', 'nfc_tokens.id')
      .join('users', 'supply_chain_events.stakeholder_id', 'users.id')
      .where('nfc_tokens.status', 'validated')
      .whereNotIn('supply_chain_events.event_type', ['counterfeit_report', 'validation_attempt'])
      .select(
        knex.raw('COUNT(DISTINCT supply_chain_events.token_id) as token_count'),
        knex.raw('COUNT(DISTINCT supply_chain_events.stakeholder_id) as user_count'),
        knex.raw('AVG(EXTRACT(EPOCH FROM (supply_chain_events.timestamp - nfc_tokens.created_at))) as avg_time_to_validation'),
        knex.raw('COUNT(CASE WHEN supply_chain_events.event_type = \'validation\' THEN 1 END) as validation_count')
      )
      .groupBy(knex.raw('DATE(supply_chain_events.timestamp)'))
      .limit(1000);

    return this.normalizeFeatures(normalPatterns);
  }

  normalizeFeatures(data) {
    // Normalize features to 0-1 range
    const features = data.map(row => {
      return [
        row.token_count / 100,
        row.user_count / 50,
        Math.min(row.avg_time_to_validation / 86400, 1), // Normalize to days
        row.validation_count / 100,
        // Add more features as needed
      ];
    });

    // Pad to fixed size
    return features.map(f => {
      while (f.length < 20) f.push(0);
      return f;
    });
  }

  async detectAnomalies(eventData) {
    if (!this.model) {
      await this.initialize();
    }

    try {
      const features = this.extractFeatures(eventData);
      const input = tf.tensor2d([features]);
      
      // Get reconstruction
      const reconstruction = this.model.predict(input);
      
      // Calculate reconstruction error
      const error = tf.losses.meanSquaredError(input, reconstruction);
      const errorValue = await error.data();
      
      input.dispose();
      reconstruction.dispose();
      error.dispose();

      const isAnomaly = errorValue[0] > this.threshold;
      const riskScore = Math.min(errorValue[0] / this.threshold, 1);

      return {
        isAnomaly,
        riskScore,
        reconstructionError: errorValue[0]
      };
    } catch (error) {
      logger.error('Error detecting anomalies:', error);
      return { isAnomaly: false, riskScore: 0, error: error.message };
    }
  }

  extractFeatures(eventData) {
    // Extract relevant features from event data
    const features = [
      eventData.validationVelocity || 0,
      eventData.uniqueLocations || 0,
      eventData.timeOfDay || 0,
      eventData.dayOfWeek || 0,
      eventData.previousReports || 0,
      eventData.userAge || 0,
      eventData.distanceFromManufacturer || 0,
      eventData.channelTrustScore || 0.5,
      // Add more features
    ];

    // Normalize and pad
    while (features.length < 20) features.push(0);
    return features.slice(0, 20);
  }

  async analyzeUserBehavior(userId) {
    try {
      // Get user's recent activities
      const activities = await knex('supply_chain_events')
        .where('stakeholder_id', userId)
        .orderBy('timestamp', 'desc')
        .limit(100);

      // Extract patterns
      const patterns = {
        validationFrequency: this.calculateFrequency(activities),
        locationVariance: this.calculateLocationVariance(activities),
        timePatterns: this.analyzeTimePatterns(activities),
        productPreferences: this.analyzeProductPreferences(activities)
      };

      // Check for anomalies
      const anomalyResult = await this.detectAnomalies(patterns);

      if (anomalyResult.isAnomaly) {
        // Record suspicious pattern
        await knex('suspicious_patterns').insert({
          id: require('uuid').v4(),
          pattern_type: 'user_behavior_anomaly',
          entity_id: userId,
          entity_type: 'user',
          risk_score: anomalyResult.riskScore,
          pattern_data: patterns,
          ml_predictions: anomalyResult,
          detected_at: new Date()
        });
      }

      return {
        patterns,
        anomalyDetected: anomalyResult.isAnomaly,
        riskScore: anomalyResult.riskScore
      };
    } catch (error) {
      logger.error('Error analyzing user behavior:', error);
      throw error;
    }
  }

  async analyzeChannel(channelId) {
    try {
      // Get channel's validation history
      const validations = await knex('supply_chain_events')
        .join('distribution_channels', function() {
          this.on(knex.raw('ST_DWithin(supply_chain_events.location::geography, distribution_channels.location::geography, 1000)'));
        })
        .where('distribution_channels.id', channelId)
        .select('supply_chain_events.*');

      // Calculate metrics
      const metrics = {
        totalValidations: validations.length,
        counterfeitReports: validations.filter(v => v.event_type === 'counterfeit_report').length,
        averageValidationTime: this.calculateAverageTime(validations),
        peakHours: this.identifyPeakHours(validations),
        customerDiversity: this.calculateCustomerDiversity(validations)
      };

      // Update channel trust score
      const counterfeitRate = metrics.counterfeitReports / Math.max(metrics.totalValidations, 1);
      const trustScore = Math.max(0, 1 - (counterfeitRate * 2)); // Penalize heavily for counterfeits

      await knex('distribution_channels')
        .where('id', channelId)
        .update({
          trust_score: trustScore,
          total_validations: metrics.totalValidations,
          counterfeit_reports: metrics.counterfeitReports,
          counterfeit_rate: counterfeitRate * 100,
          ml_analysis: metrics,
          updated_at: new Date()
        });

      return {
        channelId,
        trustScore,
        metrics,
        recommendation: trustScore < 0.3 ? 'high_risk' : trustScore < 0.7 ? 'monitor' : 'trusted'
      };
    } catch (error) {
      logger.error('Error analyzing channel:', error);
      throw error;
    }
  }

  // Helper methods
  calculateFrequency(activities) {
    if (activities.length < 2) return 0;
    const timeSpan = new Date(activities[0].timestamp) - new Date(activities[activities.length - 1].timestamp);
    return activities.length / (timeSpan / (1000 * 60 * 60 * 24)); // Activities per day
  }

  calculateLocationVariance(activities) {
    const locations = activities.filter(a => a.location).map(a => a.location);
    if (locations.length < 2) return 0;
    // Calculate variance in locations (simplified)
    return locations.length / activities.length;
  }

  analyzeTimePatterns(activities) {
    const hourCounts = new Array(24).fill(0);
    activities.forEach(a => {
      const hour = new Date(a.timestamp).getHours();
      hourCounts[hour]++;
    });
    return hourCounts;
  }

  analyzeProductPreferences(activities) {
    const products = {};
    activities.forEach(a => {
      if (a.metadata && a.metadata.product_id) {
        products[a.metadata.product_id] = (products[a.metadata.product_id] || 0) + 1;
      }
    });
    return products;
  }

  calculateAverageTime(validations) {
    if (validations.length === 0) return 0;
    const times = validations.map(v => new Date(v.timestamp).getHours());
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  identifyPeakHours(validations) {
    const hourCounts = new Array(24).fill(0);
    validations.forEach(v => {
      const hour = new Date(v.timestamp).getHours();
      hourCounts[hour]++;
    });
    
    const max = Math.max(...hourCounts);
    return hourCounts.map((count, hour) => ({ hour, count, isPeak: count > max * 0.7 }));
  }

  calculateCustomerDiversity(validations) {
    const uniqueUsers = new Set(validations.map(v => v.stakeholder_id)).size;
    return uniqueUsers / Math.max(validations.length, 1);
  }
}

module.exports = new AnomalyDetectionService();