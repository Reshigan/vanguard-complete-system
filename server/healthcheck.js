const http = require('http');
const { Pool } = require('pg');
const redis = require('redis');

// Health check configuration
const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL;

async function checkHealth() {
  const checks = {
    api: false,
    database: false,
    redis: false
  };

  // Check API
  try {
    await new Promise((resolve, reject) => {
      http.get(`http://localhost:${PORT}/api/health`, (res) => {
        if (res.statusCode === 200) {
          checks.api = true;
          resolve();
        } else {
          reject(new Error(`API returned ${res.statusCode}`));
        }
      }).on('error', reject);
    });
  } catch (error) {
    console.error('API check failed:', error.message);
  }

  // Check Database
  if (DB_URL) {
    const pool = new Pool({ connectionString: DB_URL });
    try {
      const result = await pool.query('SELECT 1');
      if (result.rows.length > 0) {
        checks.database = true;
      }
    } catch (error) {
      console.error('Database check failed:', error.message);
    } finally {
      await pool.end();
    }
  }

  // Check Redis
  if (REDIS_URL) {
    const client = redis.createClient({ url: REDIS_URL });
    try {
      await client.connect();
      await client.ping();
      checks.redis = true;
    } catch (error) {
      console.error('Redis check failed:', error.message);
    } finally {
      await client.quit();
    }
  }

  // Determine overall health
  const isHealthy = checks.api && (!DB_URL || checks.database) && (!REDIS_URL || checks.redis);
  
  if (!isHealthy) {
    console.error('Health check failed:', checks);
    process.exit(1);
  }
  
  console.log('Health check passed:', checks);
  process.exit(0);
}

// Run health check
checkHealth().catch(error => {
  console.error('Health check error:', error);
  process.exit(1);
});