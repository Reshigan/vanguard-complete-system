#!/bin/bash

# AuthentiGuard System Startup Script
echo "🚀 Starting AuthentiGuard Anti-Counterfeiting System..."

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*server" 2>/dev/null || true
pkill -f "python.*http.server" 2>/dev/null || true

# Start backend server
echo "🔧 Starting backend API server..."
cd server
npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Test backend health
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Backend server is healthy"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

# Build frontend if needed
echo "🏗️  Building frontend..."
cd ../client
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "Building production assets..."
    npm run build
fi

# Start frontend static server
echo "🎨 Starting frontend server..."
cd dist
python3 -m http.server 9000 > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"

# Wait for frontend to be ready
sleep 2

# Test frontend
if curl -s http://localhost:9000 > /dev/null; then
    echo "✅ Frontend server is healthy"
else
    echo "❌ Frontend server failed to start"
    exit 1
fi

echo ""
echo "🎉 AuthentiGuard System is now running!"
echo ""
echo "📊 Backend API: http://localhost:8080"
echo "   Health check: http://localhost:8080/health"
echo "   API docs: http://localhost:8080/api"
echo ""
echo "🎨 Frontend App: http://localhost:9000"
echo "   Main application interface"
echo ""
echo "📝 Process IDs:"
echo "   Backend: $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "📋 To stop the system:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📊 View logs:"
echo "   Backend: tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""