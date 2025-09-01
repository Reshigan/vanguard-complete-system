const { Pool } = require('pg');
const redis = require('redis');
const fs = require('fs').promises;
const path = require('path');

// Worker health check configuration
const DB_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL;
const WORKER_PID_FILE = '/tmp/vanguard-worker.pid';

async function checkWorkerHealth() {
  const checks = {
    process: false,
    database: false,
    redis: false,
    mlModels: false
  };

  // Check if worker process is running
  try {
    const pid = await fs.readFile(WORKER_PID_FILE, 'utf8');
    process.kill(parseInt(pid), 0);
    checks.process = true;
  } catch (error) {
    console.error('Worker process check failed:', error.message);
  }

  // Check Database connectivity
  if (DB_URL) {
    const pool = new Pool({ connectionString: DB_URL });
    try {
      const result = await pool.query('SELECT COUNT(*) FROM ml_models');
      checks.database = true;
    } catch (error) {
      console.error('Database check failed:', error.message);
    } finally {
      await pool.end();
    }
  }

  // Check Redis connectivity and job queue
  if (REDIS_URL) {
    const client = redis.createClient({ url: REDIS_URL });
    try {
      await client.connect();
      const queueLength = await client.lLen('ml:job:queue');
      checks.redis = true;
      console.log(`Job queue length: ${queueLength}`);
    } catch (error) {
      console.error('Redis check failed:', error.message);
    } finally {
      await client.quit();
    }
  }

  // Check ML models availability
  try {
    const modelsPath = path.join(__dirname, '../services/ml/models');
    const files = await fs.readdir(modelsPath);
    if (files.length > 0) {
      checks.mlModels = true;
    }
  } catch (error) {
    console.error('ML models check failed:', error.message);
  }

  // Determine overall health
  const isHealthy = checks.process && (!DB_URL || checks.database) && (!REDIS_URL || checks.redis);
  
  if (!isHealthy) {
    console.error('Worker health check failed:', checks);
    process.exit(1);
  }
  
  console.log('Worker health check passed:', checks);
  process.exit(0);
}

// Run health check
checkWorkerHealth().catch(error => {
  console.error('Worker health check error:', error);
  process.exit(1);
});