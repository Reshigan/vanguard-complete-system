/**
 * Verifi AI ML Worker
 * 
 * This worker processes machine learning tasks in the background:
 * - Anomaly detection in validation patterns
 * - Counterfeit risk assessment
 * - Channel risk scoring
 * - User behavior analysis
 * - Predictive analytics
 * - Pattern recognition
 */

const { Pool } = require('pg');
const Redis = require('redis');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://verifi:verifi123@localhost:5432/verifi_ai',
});

// Configure Redis connection
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Initialize Redis connection
(async () => {
  try {
    await redisClient.connect();
    console.log('✅ ML Worker connected to Redis');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
  }
})();

// ML Models (simplified implementations for demo)
class MLModels {
  constructor() {
    this.anomalyThreshold = 0.7;
    this.riskThreshold = 0.6;
    this.patterns = this.loadPatterns();
  }
  
  loadPatterns() {
    return {
      // Suspicious validation patterns
      rapidValidations: { timeWindow: 300, maxCount: 10 }, // 10 validations in 5 minutes
      geographicAnomalies: { maxSpeed: 800 }, // km/h
      unusualTimes: { nightHours: [0, 1, 2, 3, 4, 5] },
      
      // Counterfeit indicators
      highRiskProducts: ['Hennessy XO', 'Johnnie Walker Blue Label', 'Jack Daniels Single Barrel'],
      highRiskLocations: ['Miami', 'Los Angeles', 'Chicago'],
      
      // Channel risk factors
      channelRiskFactors: {
        lowValidationRate: 0.1,
        highCounterfeitRate: 0.05,
        inconsistentReporting: 0.3
      }
    };
  }
  
  // Anomaly detection model
  detectAnomalies(features) {
    let anomalyScore = 0;
    
    // Check for rapid validations
    if (features.validationsPerHour > this.patterns.rapidValidations.maxCount) {
      anomalyScore += 0.3;
    }
    
    // Check for geographic anomalies
    if (features.averageSpeed > this.patterns.geographicAnomalies.maxSpeed) {
      anomalyScore += 0.4;
    }
    
    // Check for unusual timing
    if (features.nightValidations > 0.5) {
      anomalyScore += 0.2;
    }
    
    // Check for product diversity anomaly
    if (features.uniqueProducts > 10) {
      anomalyScore += 0.1;
    }
    
    return Math.min(anomalyScore, 1.0);
  }
  
  // Counterfeit risk assessment
  assessCounterfeitRisk(features) {
    let riskScore = 0;
    
    // Product risk
    if (this.patterns.highRiskProducts.includes(features.productName)) {
      riskScore += 0.3;
    }
    
    // Location risk
    if (this.patterns.highRiskLocations.includes(features.location)) {
      riskScore += 0.2;
    }
    
    // Reporter reliability
    if (features.reporterReliability < 0.5) {
      riskScore += 0.2;
    }
    
    // Historical data
    if (features.productCounterfeitRate > 0.1) {
      riskScore += 0.3;
    }
    
    return Math.min(riskScore, 1.0);
  }
  
  // Channel risk scoring
  scoreChannelRisk(features) {
    let riskScore = 0;
    
    // Low validation rate
    if (features.validationRate < this.patterns.channelRiskFactors.lowValidationRate) {
      riskScore += 0.3;
    }
    
    // High counterfeit rate
    if (features.counterfeitRate > this.patterns.channelRiskFactors.highCounterfeitRate) {
      riskScore += 0.4;
    }
    
    // Inconsistent reporting
    if (features.reportingConsistency < this.patterns.channelRiskFactors.inconsistentReporting) {
      riskScore += 0.3;
    }
    
    return Math.min(riskScore, 1.0);
  }
}

const mlModels = new MLModels();

// Process validation data for anomalies
async function processValidations() {
  try {
    console.log('🔍 Processing validations for anomalies...');
    const client = await pool.connect();
    
    // Get recent validations (last 24 hours)
    const validationsResult = await client.query(`
      SELECT 
        v.id, v.token_id, v.user_id, v.validation_time, 
        v.location_latitude, v.location_longitude, v.is_authentic,
        t.product_id, p.name as product_name, p.manufacturer_id
      FROM token_validations v
      JOIN tokens t ON v.token_id = t.id
      JOIN products p ON t.product_id = p.id
      WHERE v.validation_time > NOW() - INTERVAL '24 hours'
      ORDER BY v.validation_time DESC
    `);
    
    const validations = validationsResult.rows;
    console.log(`📊 Found ${validations.length} recent validations`);
    
    // Group validations by user
    const userValidations = {};
    validations.forEach(validation => {
      if (!userValidations[validation.user_id]) {
        userValidations[validation.user_id] = [];
      }
      userValidations[validation.user_id].push(validation);
    });
    
    // Analyze each user's validation patterns
    for (const userId in userValidations) {
      const userVals = userValidations[userId];
      
      // Skip users with fewer than 3 validations
      if (userVals.length < 3) continue;
      
      // Extract features for anomaly detection
      const features = extractValidationFeatures(userVals);
      
      // Detect anomalies
      const anomalyScore = mlModels.detectAnomalies(features);
      
      // If anomaly score is high, record it
      if (anomalyScore > mlModels.anomalyThreshold) {
        await client.query(`
          INSERT INTO ai_detected_anomalies 
          (id, anomaly_type, description, confidence, data, status, detected_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          uuidv4(),
          'validation_pattern',
          `Unusual validation pattern detected for user ${userId}`,
          anomalyScore,
          JSON.stringify({
            user_id: userId,
            validation_count: userVals.length,
            time_period: '24 hours',
            features: features,
            validation_ids: userVals.map(v => v.id)
          }),
          'new',
          new Date()
        ]);
        
        console.log(`🚨 Anomaly detected for user ${userId} with score ${anomalyScore.toFixed(3)}`);
      }
    }
    
    client.release();
    console.log('✅ Validation processing completed');
  } catch (error) {
    console.error('❌ Error processing validations:', error);
  }
}

// Extract features from validation data
function extractValidationFeatures(validations) {
  // Sort by time
  validations.sort((a, b) => new Date(a.validation_time) - new Date(b.validation_time));
  
  // Calculate time differences between validations in minutes
  const timeDiffs = [];
  for (let i = 1; i < validations.length; i++) {
    const diff = (new Date(validations[i].validation_time) - new Date(validations[i-1].validation_time)) / (1000 * 60);
    timeDiffs.push(diff);
  }
  
  // Calculate distances between validations
  const distances = [];
  const speeds = [];
  for (let i = 1; i < validations.length; i++) {
    if (validations[i-1].location_latitude && validations[i].location_latitude) {
      const dist = calculateDistance(
        validations[i-1].location_latitude, validations[i-1].location_longitude,
        validations[i].location_latitude, validations[i].location_longitude
      );
      distances.push(dist);
      
      // Calculate speed (km/h)
      const timeDiffHours = timeDiffs[i-1] / 60;
      if (timeDiffHours > 0) {
        speeds.push(dist / timeDiffHours);
      }
    }
  }
  
  // Count unique products and manufacturers
  const uniqueProducts = new Set(validations.map(v => v.product_id)).size;
  const uniqueManufacturers = new Set(validations.map(v => v.manufacturer_id)).size;
  
  // Count authentic vs non-authentic
  const authenticCount = validations.filter(v => v.is_authentic).length;
  const nonAuthenticCount = validations.length - authenticCount;
  
  // Calculate time-based features
  const avgTimeDiff = timeDiffs.length > 0 ? timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length : 0;
  const avgDistance = distances.length > 0 ? distances.reduce((a, b) => a + b, 0) / distances.length : 0;
  const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
  
  // Night validations (between 12 AM and 6 AM)
  const nightValidations = validations.filter(v => {
    const hour = new Date(v.validation_time).getHours();
    return hour >= 0 && hour < 6;
  }).length;
  
  return {
    validationCount: validations.length,
    authenticRate: authenticCount / validations.length,
    nonAuthenticRate: nonAuthenticCount / validations.length,
    uniqueProducts: uniqueProducts,
    uniqueManufacturers: uniqueManufacturers,
    avgTimeDiff: avgTimeDiff,
    avgDistance: avgDistance,
    averageSpeed: avgSpeed,
    maxSpeed: maxSpeed,
    validationsPerHour: validations.length / 24, // Over 24 hours
    nightValidations: nightValidations / validations.length,
    productDiversity: uniqueProducts / validations.length
  };
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// Process counterfeit reports
async function processCounterfeitReports() {
  try {
    console.log('🔍 Processing counterfeit reports...');
    const client = await pool.connect();
    
    // Get recent counterfeit reports
    const reportsResult = await client.query(`
      SELECT 
        r.id, r.token_id, r.reporter_id, r.report_time, 
        r.location_latitude, r.location_longitude, r.store_name,
        r.description, r.status, r.images,
        t.product_id, p.name as product_name, p.manufacturer_id
      FROM counterfeit_reports r
      JOIN tokens t ON r.token_id = t.id
      JOIN products p ON t.product_id = p.id
      WHERE r.status IN ('pending', 'investigating')
      ORDER BY r.report_time DESC
    `);
    
    const reports = reportsResult.rows;
    console.log(`📊 Found ${reports.length} pending reports`);
    
    for (const report of reports) {
      // Get reporter history
      const reporterHistoryResult = await client.query(`
        SELECT COUNT(*) as report_count, 
               COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count
        FROM counterfeit_reports
        WHERE reporter_id = $1
      `, [report.reporter_id]);
      
      const reporterHistory = reporterHistoryResult.rows[0];
      
      // Get product validation history
      const productValidationsResult = await client.query(`
        SELECT COUNT(*) as validation_count,
               COUNT(CASE WHEN is_authentic = false THEN 1 END) as non_authentic_count
        FROM token_validations v
        JOIN tokens t ON v.token_id = t.id
        WHERE t.product_id = $1
      `, [report.product_id]);
      
      const productValidations = productValidationsResult.rows[0];
      
      // Extract features for counterfeit risk assessment
      const features = {
        productName: report.product_name,
        location: report.store_name || 'Unknown',
        reporterReliability: reporterHistory.report_count > 0 ? 
          reporterHistory.confirmed_count / reporterHistory.report_count : 0.5,
        productCounterfeitRate: productValidations.validation_count > 0 ? 
          productValidations.non_authentic_count / productValidations.validation_count : 0
      };
      
      // Assess counterfeit risk
      const riskScore = mlModels.assessCounterfeitRisk(features);
      
      // Update report with risk assessment
      const newStatus = riskScore > mlModels.riskThreshold ? 'investigating' : 'pending';
      
      await client.query(`
        UPDATE counterfeit_reports
        SET status = $1, 
            metadata = jsonb_set(
              COALESCE(metadata, '{}'::jsonb),
              '{ai_risk_assessment}',
              $2::jsonb
            )
        WHERE id = $3
      `, [
        newStatus,
        JSON.stringify({
          risk_score: riskScore,
          assessment_time: new Date().toISOString(),
          factors: {
            product_risk: features.productCounterfeitRate,
            reporter_reliability: features.reporterReliability,
            location_risk: mlModels.patterns.highRiskLocations.includes(features.location) ? 0.8 : 0.2
          },
          recommendation: riskScore > 0.8 ? 'immediate_investigation' : 
                          riskScore > 0.6 ? 'priority_review' : 'standard_review'
        }),
        report.id
      ]);
      
      console.log(`📋 Processed report ${report.id} with risk score ${riskScore.toFixed(3)}`);
    }
    
    client.release();
    console.log('✅ Counterfeit report processing completed');
  } catch (error) {
    console.error('❌ Error processing counterfeit reports:', error);
  }
}

// Update channel risk scores
async function updateChannelRiskScores() {
  try {
    console.log('🔍 Updating channel risk scores...');
    const client = await pool.connect();
    
    // Get all distribution channels
    const channelsResult = await client.query(`
      SELECT * FROM distribution_channels
      WHERE is_active = true
    `);
    
    const channels = channelsResult.rows;
    console.log(`📊 Found ${channels.length} active channels`);
    
    for (const channel of channels) {
      // Get validation statistics for this channel
      const validationStatsResult = await client.query(`
        SELECT 
          COUNT(*) as total_validations,
          COUNT(CASE WHEN v.is_authentic = false THEN 1 END) as non_authentic_count,
          COUNT(DISTINCT v.user_id) as unique_users,
          COUNT(DISTINCT t.product_id) as unique_products
        FROM token_validations v
        JOIN tokens t ON v.token_id = t.id
        JOIN supply_chain_events e ON t.id = e.token_id
        WHERE e.channel_id = $1
        AND v.validation_time > NOW() - INTERVAL '90 days'
      `, [channel.id]);
      
      const stats = validationStatsResult.rows[0];
      
      // Skip channels with no validations
      if (stats.total_validations === 0) continue;
      
      // Get counterfeit reports for this channel
      const reportsResult = await client.query(`
        SELECT COUNT(*) as report_count,
               COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count
        FROM counterfeit_reports r
        JOIN supply_chain_events e ON r.token_id = e.token_id
        WHERE e.channel_id = $1
        AND r.report_time > NOW() - INTERVAL '90 days'
      `, [channel.id]);
      
      const reports = reportsResult.rows[0];
      
      // Extract features for channel risk assessment
      const features = {
        validationRate: stats.total_validations / 1000, // Normalized
        counterfeitRate: stats.non_authentic_count / stats.total_validations,
        reportingConsistency: reports.report_count > 0 ? 
          reports.confirmed_count / reports.report_count : 1.0
      };
      
      // Calculate channel risk score
      const riskScore = mlModels.scoreChannelRisk(features);
      
      // Update channel risk score
      await client.query(`
        UPDATE distribution_channels
        SET risk_score = $1,
            metadata = jsonb_set(
              COALESCE(metadata, '{}'::jsonb),
              '{risk_assessment}',
              $2::jsonb
            )
        WHERE id = $3
      `, [
        riskScore,
        JSON.stringify({
          assessment_time: new Date().toISOString(),
          risk_score: riskScore,
          factors: {
            validation_stats: {
              total_validations: stats.total_validations,
              counterfeit_rate: features.counterfeitRate,
              unique_users: stats.unique_users,
              unique_products: stats.unique_products
            },
            report_stats: {
              total_reports: reports.report_count,
              confirmed_reports: reports.confirmed_count,
              reporting_consistency: features.reportingConsistency
            }
          },
          risk_level: riskScore > 0.8 ? 'critical' : 
                     riskScore > 0.6 ? 'high' : 
                     riskScore > 0.4 ? 'medium' : 'low'
        }),
        channel.id
      ]);
      
      console.log(`📋 Updated risk score for channel ${channel.id} to ${riskScore.toFixed(3)}`);
    }
    
    client.release();
    console.log('✅ Channel risk score update completed');
  } catch (error) {
    console.error('❌ Error updating channel risk scores:', error);
  }
}

// Generate suspicious pattern alerts
async function generateSuspiciousPatternAlerts() {
  try {
    console.log('🔍 Generating suspicious pattern alerts...');
    const client = await pool.connect();
    
    // Look for geographic anomalies
    const geoAnomaliesResult = await client.query(`
      WITH user_validations AS (
        SELECT 
          user_id,
          validation_time,
          location_latitude,
          location_longitude,
          LAG(validation_time) OVER (PARTITION BY user_id ORDER BY validation_time) as prev_time,
          LAG(location_latitude) OVER (PARTITION BY user_id ORDER BY validation_time) as prev_lat,
          LAG(location_longitude) OVER (PARTITION BY user_id ORDER BY validation_time) as prev_lon
        FROM token_validations
        WHERE validation_time > NOW() - INTERVAL '24 hours'
        AND location_latitude IS NOT NULL
        AND location_longitude IS NOT NULL
      )
      SELECT 
        user_id,
        validation_time,
        prev_time,
        location_latitude,
        location_longitude,
        prev_lat,
        prev_lon
      FROM user_validations
      WHERE 
        prev_time IS NOT NULL AND
        EXTRACT(EPOCH FROM (validation_time - prev_time)) / 60 < 60
      ORDER BY user_id, validation_time
    `);
    
    const geoAnomalies = geoAnomaliesResult.rows;
    
    // Process potential geographic anomalies
    for (const anomaly of geoAnomalies) {
      const distance = calculateDistance(
        anomaly.prev_lat, anomaly.prev_lon,
        anomaly.location_latitude, anomaly.location_longitude
      );
      
      const timeDiff = (new Date(anomaly.validation_time) - new Date(anomaly.prev_time)) / (1000 * 60); // minutes
      const speed = distance / (timeDiff / 60); // km/h
      
      // If speed is unreasonably high (> 800 km/h), flag as suspicious
      if (speed > 800) {
        await client.query(`
          INSERT INTO suspicious_patterns
          (id, pattern_type, description, affected_entities, risk_score, detected_at, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          uuidv4(),
          'geographic_anomaly',
          `User ${anomaly.user_id} validated products ${distance.toFixed(2)} km apart within ${timeDiff.toFixed(2)} minutes (${speed.toFixed(2)} km/h)`,
          JSON.stringify({
            user_id: anomaly.user_id,
            locations: [
              {
                latitude: anomaly.prev_lat,
                longitude: anomaly.prev_lon,
                time: anomaly.prev_time
              },
              {
                latitude: anomaly.location_latitude,
                longitude: anomaly.location_longitude,
                time: anomaly.validation_time
              }
            ],
            distance_km: distance,
            time_diff_minutes: timeDiff,
            speed_kmh: speed
          }),
          Math.min(0.5 + (speed - 800) / 1000, 0.99),
          new Date(),
          'open'
        ]);
        
        console.log(`🚨 Geographic anomaly detected for user ${anomaly.user_id}: ${speed.toFixed(2)} km/h`);
      }
    }
    
    // Look for validation frequency anomalies
    const freqAnomaliesResult = await client.query(`
      SELECT 
        user_id,
        COUNT(*) as validation_count,
        MIN(validation_time) as first_validation,
        MAX(validation_time) as last_validation
      FROM token_validations
      WHERE validation_time > NOW() - INTERVAL '1 hour'
      GROUP BY user_id
      HAVING COUNT(*) > 10
      ORDER BY validation_count DESC
    `);
    
    const freqAnomalies = freqAnomaliesResult.rows;
    
    // Process frequency anomalies
    for (const anomaly of freqAnomalies) {
      const timeDiff = (new Date(anomaly.last_validation) - new Date(anomaly.first_validation)) / (1000 * 60);
      const validationsPerMinute = anomaly.validation_count / (timeDiff || 1);
      
      // If more than 2 validations per minute, flag as suspicious
      if (validationsPerMinute > 2) {
        await client.query(`
          INSERT INTO suspicious_patterns
          (id, pattern_type, description, affected_entities, risk_score, detected_at, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          uuidv4(),
          'frequency_anomaly',
          `User ${anomaly.user_id} performed ${anomaly.validation_count} validations in ${timeDiff.toFixed(2)} minutes (${validationsPerMinute.toFixed(2)} per minute)`,
          JSON.stringify({
            user_id: anomaly.user_id,
            validation_count: anomaly.validation_count,
            time_period_minutes: timeDiff,
            validations_per_minute: validationsPerMinute,
            first_validation: anomaly.first_validation,
            last_validation: anomaly.last_validation
          }),
          Math.min(0.5 + (validationsPerMinute - 2) / 10, 0.99),
          new Date(),
          'open'
        ]);
        
        console.log(`🚨 Frequency anomaly detected for user ${anomaly.user_id}: ${validationsPerMinute.toFixed(2)} validations/minute`);
      }
    }
    
    client.release();
    console.log('✅ Suspicious pattern alert generation completed');
  } catch (error) {
    console.error('❌ Error generating suspicious pattern alerts:', error);
  }
}

// Generate predictive insights
async function generatePredictiveInsights() {
  try {
    console.log('🔮 Generating predictive insights...');
    const client = await pool.connect();
    
    // Predict validation trends
    const validationTrendsResult = await client.query(`
      SELECT 
        DATE_TRUNC('day', validation_time) as date,
        COUNT(*) as validations,
        COUNT(CASE WHEN is_authentic = false THEN 1 END) as counterfeits
      FROM token_validations
      WHERE validation_time > NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', validation_time)
      ORDER BY date
    `);
    
    const trends = validationTrendsResult.rows;
    
    if (trends.length >= 7) {
      // Simple trend analysis
      const recentWeek = trends.slice(-7);
      const previousWeek = trends.slice(-14, -7);
      
      const recentAvg = recentWeek.reduce((sum, day) => sum + parseInt(day.validations), 0) / 7;
      const previousAvg = previousWeek.reduce((sum, day) => sum + parseInt(day.validations), 0) / 7;
      
      const growthRate = (recentAvg - previousAvg) / previousAvg;
      const predictedNext7Days = Math.round(recentAvg * 7 * (1 + growthRate));
      
      // Store prediction
      await client.query(`
        INSERT INTO ai_predictions 
        (id, prediction_type, description, predicted_value, confidence, data, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (prediction_type) 
        DO UPDATE SET 
          predicted_value = $4,
          confidence = $5,
          data = $6,
          created_at = $7
      `, [
        uuidv4(),
        'validation_trend_7d',
        'Predicted validations for next 7 days',
        predictedNext7Days,
        Math.min(0.7 + (trends.length / 30) * 0.3, 0.95), // Confidence based on data points
        JSON.stringify({
          current_avg_daily: recentAvg,
          growth_rate: growthRate,
          prediction_period: '7_days',
          based_on_days: trends.length
        }),
        new Date()
      ]);
      
      console.log(`📈 Predicted ${predictedNext7Days} validations for next 7 days (${(growthRate * 100).toFixed(1)}% growth)`);
    }
    
    client.release();
    console.log('✅ Predictive insights generation completed');
  } catch (error) {
    console.error('❌ Error generating predictive insights:', error);
  }
}

// Main worker loop
async function runWorker() {
  try {
    console.log('🚀 Starting Verifi AI ML Worker...');
    
    // Run initial tasks
    await processValidations();
    await processCounterfeitReports();
    await updateChannelRiskScores();
    await generateSuspiciousPatternAlerts();
    await generatePredictiveInsights();
    
    // Set up periodic tasks
    setInterval(processValidations, 15 * 60 * 1000); // Every 15 minutes
    setInterval(processCounterfeitReports, 30 * 60 * 1000); // Every 30 minutes
    setInterval(updateChannelRiskScores, 60 * 60 * 1000); // Every hour
    setInterval(generateSuspiciousPatternAlerts, 20 * 60 * 1000); // Every 20 minutes
    setInterval(generatePredictiveInsights, 6 * 60 * 60 * 1000); // Every 6 hours
    
    console.log('✅ Verifi AI ML Worker initialized and running');
    console.log('📊 Monitoring patterns: anomalies, counterfeits, channels, predictions');
  } catch (error) {
    console.error('❌ Error in ML worker:', error);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down ML worker...');
  await redisClient.quit();
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down ML worker...');
  await redisClient.quit();
  await pool.end();
  process.exit(0);
});

// Start the worker
runWorker();