#!/bin/bash

# Quick Application Update Script
# Lightweight script for routine updates to both backend and frontend
# Optimized for speed and minimal downtime

set -e

# Configuration
REGION=${REGION:-"us-central1"}
BACKEND_SERVICE="retail-backend"
FRONTEND_SERVICE="retail-frontend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Quick header
echo -e "${BLUE}🔄 Quick App Update - $(date)${NC}"
echo "================================="

# Quick prerequisite check
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${RED}❌ OPENAI_API_KEY required${NC}"
    exit 1
fi

PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$PROJECT" ]; then
    echo -e "${RED}❌ No GCP project configured${NC}"
    exit 1
fi

echo -e "📋 Project: ${PROJECT} | Region: ${REGION}"

# Get current service URLs for validation
CURRENT_BACKEND=$(gcloud run services describe ${BACKEND_SERVICE} --region=${REGION} --format="value(status.url)" 2>/dev/null || echo "")
CURRENT_FRONTEND=$(gcloud run services describe ${FRONTEND_SERVICE} --region=${REGION} --format="value(status.url)" 2>/dev/null || echo "")

if [ -n "$CURRENT_BACKEND" ]; then
    echo -e "🔧 Current Backend: ${CURRENT_BACKEND}"
fi
if [ -n "$CURRENT_FRONTEND" ]; then
    echo -e "🌐 Current Frontend: ${CURRENT_FRONTEND}"
fi

echo ""

# Backend Update
echo -e "${YELLOW}📦 Updating Backend...${NC}"
start_time=$(date +%s)

if ./deploy-backend-cloudrun.sh > /tmp/backend-deploy.log 2>&1; then
    duration=$(($(date +%s) - start_time))
    echo -e "${GREEN}✅ Backend updated in ${duration}s${NC}"
    
    NEW_BACKEND=$(gcloud run services describe ${BACKEND_SERVICE} --region=${REGION} --format="value(status.url)")
    
    # Quick health check
    if curl -f "${NEW_BACKEND}/api/health" -m 15 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend health OK${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
        echo "Check logs: gcloud run logs tail ${BACKEND_SERVICE} --region=${REGION}"
        exit 1
    fi
else
    echo -e "${RED}❌ Backend update failed${NC}"
    echo "Log: /tmp/backend-deploy.log"
    exit 1
fi

echo ""

# Frontend Update
echo -e "${YELLOW}🌐 Updating Frontend...${NC}"
export BACKEND_URL=$NEW_BACKEND
start_time=$(date +%s)

if ./deploy-frontend-cloudrun.sh > /tmp/frontend-deploy.log 2>&1; then
    duration=$(($(date +%s) - start_time))
    echo -e "${GREEN}✅ Frontend updated in ${duration}s${NC}"
    
    NEW_FRONTEND=$(gcloud run services describe ${FRONTEND_SERVICE} --region=${REGION} --format="value(status.url)")
    
    # Quick accessibility check
    if curl -f "${NEW_FRONTEND}" -m 15 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend accessible${NC}"
    else
        echo -e "${RED}❌ Frontend accessibility failed${NC}"
        echo "Check logs: gcloud run logs tail ${FRONTEND_SERVICE} --region=${REGION}"
        exit 1
    fi
else
    echo -e "${RED}❌ Frontend update failed${NC}"
    echo "Log: /tmp/frontend-deploy.log"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Update Completed Successfully!${NC}"
echo "=================================="
echo -e "🌐 Frontend: ${NEW_FRONTEND}"
echo -e "🔧 Backend:  ${NEW_BACKEND}"
echo ""
echo -e "${BLUE}Quick Test:${NC}"
echo "curl ${NEW_BACKEND}/api/health"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo "Backend:  /tmp/backend-deploy.log"
echo "Frontend: /tmp/frontend-deploy.log"