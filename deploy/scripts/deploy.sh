#!/bin/bash

# Cloud deployment script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="retail-analytics-chatbot"

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Check required environment variables
required_vars=("OPENAI_API_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var environment variable is required"
        exit 1
    fi
done

# Build and deploy based on environment
case $ENVIRONMENT in
    "production")
        echo "📦 Building for production..."
        docker-compose -f docker-compose.prod.yml build --no-cache
        
        echo "🔄 Starting services..."
        docker-compose -f docker-compose.prod.yml up -d
        
        echo "🏥 Waiting for health checks..."
        sleep 30
        
        # Health check
        if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
            echo "✅ Backend health check passed"
        else
            echo "❌ Backend health check failed"
            docker-compose -f docker-compose.prod.yml logs backend
            exit 1
        fi
        
        if curl -f http://localhost/ > /dev/null 2>&1; then
            echo "✅ Frontend health check passed"
        else
            echo "❌ Frontend health check failed"
            docker-compose -f docker-compose.prod.yml logs frontend
            exit 1
        fi
        ;;
        
    "development")
        echo "🛠️ Starting development environment..."
        docker-compose up -d
        echo "🔗 Frontend: http://localhost:5173"
        echo "🔗 Backend API: http://localhost:5000/api"
        ;;
        
    *)
        echo "❌ Unknown environment: $ENVIRONMENT"
        echo "Available: production, development"
        exit 1
        ;;
esac

echo "🎉 Deployment completed successfully!"
echo "📊 Monitor logs with: docker-compose logs -f"