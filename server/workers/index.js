const fs = require('fs').promises;
const path = require('path');
const redis = require('redis');
const { Pool } = require('pg');

// Worker configuration
const WORKER_PID_FILE = '/tmp/vanguard-worker.pid';
const DB_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL;

// Initialize connections
let redisClient;
let dbPool;

async function initializeConnections() {
  // Initialize Redis
  if (REDIS_URL) {
    redisClient = redis.createClient({ url: REDIS_URL });
    await redisClient.connect();
    console.log('Redis connected');
  }

  // Initialize PostgreSQL
  if (DB_URL) {
    dbPool = new Pool({ connectionString: DB_URL });
    console.log('PostgreSQL connected');
  }
}

async function processMLJob(job) {
  console.log('Processing ML job:', job.type, job.id);
  
  try {
    switch (job.type) {
      case 'anomaly_detection':
        // Process anomaly detection
        await processAnomalyDetection(job.data);
        break;
      
      case 'pattern_analysis':
        // Process pattern analysis
        await processPatternAnalysis(job.data);
        break;
      
      case 'model_training':
        // Process model training
        await processModelTraining(job.data);
        break;
      
      default:
        console.error('Unknown job type:', job.type);
    }
    
    // Mark job as completed
    if (redisClient) {
      await redisClient.hSet(`ml:job:${job.id}`, 'status', 'completed');
      await redisClient.hSet(`ml:job:${job.id}`, 'completedAt', new Date().toISOString());
    }
  } catch (error) {
    console.error('Job processing error:', error);
    
    // Mark job as failed
    if (redisClient) {
      await redisClient.hSet(`ml:job:${job.id}`, 'status', 'failed');
      await redisClient.hSet(`ml:job:${job.id}`, 'error', error.message);
    }
  }
}

async function processAnomalyDetection(data) {
  // Simulate anomaly detection processing
  console.log('Running anomaly detection on:', data);
  
  // In a real implementation, this would:
  // 1. Load the ML model
  // 2. Process the data
  // 3. Store results in database
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
}

async function processPatternAnalysis(data) {
  // Simulate pattern analysis
  console.log('Running pattern analysis on:', data);
  
  await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing
}

async function processModelTraining(data) {
  // Simulate model training
  console.log('Training model with:', data);
  
  await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate processing
}

async function startWorker() {
  console.log('Starting Vanguard ML Worker...');
  
  // Write PID file
  await fs.writeFile(WORKER_PID_FILE, process.pid.toString());
  
  // Initialize connections
  await initializeConnections();
  
  // Main worker loop
  while (true) {
    try {
      if (redisClient) {
        // Check for jobs in the queue
        const jobData = await redisClient.lPop('ml:job:queue');
        
        if (jobData) {
          const job = JSON.parse(jobData);
          await processMLJob(job);
        } else {
          // No jobs, wait a bit
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        // No Redis, just wait
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error('Worker loop error:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  if (redisClient) {
    await redisClient.quit();
  }
  
  if (dbPool) {
    await dbPool.end();
  }
  
  // Remove PID file
  try {
    await fs.unlink(WORKER_PID_FILE);
  } catch (error) {
    // Ignore error if file doesn't exist
  }
  
  process.exit(0);
});

// Start the worker
startWorker().catch(error => {
  console.error('Worker startup error:', error);
  process.exit(1);
});