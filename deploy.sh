#!/bin/bash

# Production deployment script for HeliLog

set -e

echo "🚀 Starting HeliLog production deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Build and start containers
echo "🏗️  Building containers..."
docker-compose build --no-cache

echo "▶️  Starting containers..."
docker-compose up -d

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Check if backend is running
if curl -f http://localhost:3000/api/helicopters > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:3000"
else
    echo "⚠️  Backend might not be ready yet. Check logs with: docker-compose logs backend"
fi

# Check if frontend is running
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is running on http://localhost"
else
    echo "⚠️  Frontend might not be ready yet. Check logs with: docker-compose logs frontend"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Application URLs:"
echo "   Frontend: http://localhost"
echo "   Backend:  http://localhost:3000"
echo ""
echo "📝 Useful commands:"
echo "   View logs:          docker-compose logs -f"
echo "   Stop containers:    docker-compose down"
echo "   Restart containers: docker-compose restart"
echo "   View status:        docker-compose ps"
echo ""
