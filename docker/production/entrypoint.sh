#!/bin/sh

# Verifi AI Production Entrypoint Script

set -e

echo "🚀 Starting Verifi AI Production Server..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until pg_isready -h ${DATABASE_HOST:-db} -p ${DATABASE_PORT:-5432} -U ${DATABASE_USER:-verifi}; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "✅ Database is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis connection..."
until redis-cli -h ${REDIS_HOST:-redis} -p ${REDIS_PORT:-6379} ping; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
cd /app/server
npm run migrate

# Seed database if needed
if [ "$SEED_DATABASE" = "true" ]; then
  echo "🌱 Seeding database..."
  npm run seed
fi

# Start ML worker in background if enabled
if [ "$ENABLE_ML_WORKER" = "true" ]; then
  echo "🤖 Starting ML Worker..."
  node workers/ml-worker.js &
  ML_WORKER_PID=$!
  echo "ML Worker started with PID: $ML_WORKER_PID"
fi

# Start the main application
echo "🌟 Starting Verifi AI Server..."
exec node index.js