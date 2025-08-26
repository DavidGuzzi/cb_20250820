#!/bin/bash

# Deploy to Cloud Run script
set -e

# Configuration
PROJECT_ID="${GCLOUD_PROJECT:-your-project-id}"
REGION="${GCLOUD_REGION:-us-central1}"
BACKEND_SERVICE="retail-backend"
FRONTEND_SERVICE="retail-frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying to Cloud Run${NC}"

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check if PROJECT_ID is set
if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo -e "${YELLOW}⚠️  Please set your PROJECT_ID in the script or as environment variable GCLOUD_PROJECT${NC}"
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID
fi

echo -e "${YELLOW}📋 Using Project: $PROJECT_ID${NC}"
echo -e "${YELLOW}📋 Using Region: $REGION${NC}"

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

# Deploy Backend
echo -e "${GREEN}🔨 Deploying Backend...${NC}"
# Build and submit using Cloud Build, then deploy
gcloud builds submit ./backend --dockerfile=./backend/Dockerfile.cloudrun --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE

gcloud run deploy $BACKEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars "FLASK_ENV=production"

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
echo -e "${GREEN}✅ Backend deployed at: $BACKEND_URL${NC}"

# Deploy Frontend
echo -e "${GREEN}🔨 Deploying Frontend...${NC}"
# Set the API URL for the frontend build
export VITE_API_URL=$BACKEND_URL

# Build and submit frontend using Cloud Build, then deploy
gcloud builds submit ./frontend --dockerfile=./frontend/Dockerfile.cloudrun --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE

gcloud run deploy $FRONTEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --timeout 300 \
  --set-env-vars "VITE_API_URL=$BACKEND_URL"

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format="value(status.url)")
echo -e "${GREEN}✅ Frontend deployed at: $FRONTEND_URL${NC}"

echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}📱 Frontend: $FRONTEND_URL${NC}"
echo -e "${GREEN}🔌 Backend: $BACKEND_URL${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "1. Set your OPENAI_API_KEY in Cloud Run backend service"
echo -e "2. Test the application"
echo -e "3. Monitor performance and costs"
echo ""
echo -e "${YELLOW}💡 To set environment variables:${NC}"
echo -e "gcloud run services update $BACKEND_SERVICE --region=$REGION --set-env-vars=\"OPENAI_API_KEY=your-api-key\""