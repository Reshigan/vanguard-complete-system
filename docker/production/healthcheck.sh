#!/bin/sh

# Verifi AI Health Check Script

set -e

# Check if the main API is responding
API_HEALTH=$(curl -f -s http://localhost:3001/api/health || echo "FAIL")

if [ "$API_HEALTH" = "FAIL" ]; then
  echo "❌ API health check failed"
  exit 1
fi

# Check database connection
DB_CHECK=$(pg_isready -h ${DATABASE_HOST:-db} -p ${DATABASE_PORT:-5432} -U ${DATABASE_USER:-verifi} || echo "FAIL")

if [ "$DB_CHECK" = "FAIL" ]; then
  echo "❌ Database health check failed"
  exit 1
fi

# Check Redis connection
REDIS_CHECK=$(redis-cli -h ${REDIS_HOST:-redis} -p ${REDIS_PORT:-6379} ping || echo "FAIL")

if [ "$REDIS_CHECK" != "PONG" ]; then
  echo "❌ Redis health check failed"
  exit 1
fi

echo "✅ All health checks passed"
exit 0