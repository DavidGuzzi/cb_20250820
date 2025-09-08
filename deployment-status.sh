#!/bin/bash

# Deployment Status Check Script
# Quick way to check the status of your deployed services

set -e

REGION=${REGION:-"us-central1"}
BACKEND_SERVICE="retail-backend"
FRONTEND_SERVICE="retail-frontend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}📊 Deployment Status Check${NC}"
echo "=========================="
echo -e "Region: ${REGION}"
echo -e "Time: $(date)"
echo ""

# Check if services exist and get basic info
check_service() {
    local service_name=$1
    local service_type=$2
    
    echo -e "${CYAN}${service_type} Service: ${service_name}${NC}"
    echo "----------------------------------------"
    
    # Check if service exists
    local service_url=$(gcloud run services describe ${service_name} --region=${REGION} --format="value(status.url)" 2>/dev/null || echo "")
    
    if [ -z "$service_url" ]; then
        echo -e "${RED}❌ Service not found${NC}"
        echo ""
        return
    fi
    
    echo -e "🔗 URL: ${service_url}"
    
    # Get service info
    local traffic=$(gcloud run services describe ${service_name} --region=${REGION} --format="value(status.traffic[0].percent)" 2>/dev/null || echo "")
    local revision=$(gcloud run services describe ${service_name} --region=${REGION} --format="value(status.traffic[0].revisionName)" 2>/dev/null || echo "")
    local image=$(gcloud run services describe ${service_name} --region=${REGION} --format="value(spec.template.spec.template.spec.containers[0].image)" 2>/dev/null || echo "")
    
    echo -e "📦 Current Revision: ${revision}"
    echo -e "🚦 Traffic: ${traffic}%"
    
    # Health check
    echo -n "🏥 Health: "
    if [ "$service_type" = "Backend" ]; then
        if curl -f "${service_url}/api/health" -m 10 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Healthy${NC}"
        else
            echo -e "${RED}❌ Unhealthy${NC}"
        fi
    else
        if curl -f "${service_url}" -m 10 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Accessible${NC}"
        else
            echo -e "${RED}❌ Inaccessible${NC}"
        fi
    fi
    
    # Recent deployments
    echo -n "⏱️  Last Deploy: "
    local last_deploy=$(gcloud run revisions list --service=${service_name} --region=${REGION} --limit=1 --format="value(metadata.creationTimestamp)" 2>/dev/null || echo "")
    if [ -n "$last_deploy" ]; then
        echo "${last_deploy}"
    else
        echo "Unknown"
    fi
    
    echo ""
}

# Check project
PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$PROJECT" ]; then
    echo -e "${RED}❌ No GCP project configured${NC}"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "📋 Project: ${PROJECT}"
echo ""

# Check both services
check_service ${BACKEND_SERVICE} "Backend"
check_service ${FRONTEND_SERVICE} "Frontend"

# Quick integration test
echo -e "${CYAN}🔗 Integration Test${NC}"
echo "----------------------------------------"

BACKEND_URL=$(gcloud run services describe ${BACKEND_SERVICE} --region=${REGION} --format="value(status.url)" 2>/dev/null || echo "")
FRONTEND_URL=$(gcloud run services describe ${FRONTEND_SERVICE} --region=${REGION} --format="value(status.url)" 2>/dev/null || echo "")

if [ -n "$BACKEND_URL" ] && [ -n "$FRONTEND_URL" ]; then
    echo -n "🧪 End-to-End: "
    
    # Test backend health
    if curl -f "${BACKEND_URL}/api/health" -m 10 > /dev/null 2>&1; then
        # Test frontend and check if it can reach backend
        if curl -f "${FRONTEND_URL}" -m 10 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Both services operational${NC}"
        else
            echo -e "${YELLOW}⚠️ Backend OK, Frontend issues${NC}"
        fi
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ One or both services missing${NC}"
fi

echo ""
echo -e "${BLUE}📝 Quick Commands:${NC}"
if [ -n "$BACKEND_URL" ]; then
    echo "  Test Backend:  curl ${BACKEND_URL}/api/health"
fi
if [ -n "$FRONTEND_URL" ]; then
    echo "  Test Frontend: curl -I ${FRONTEND_URL}"
fi
echo "  Backend Logs:  gcloud run logs tail ${BACKEND_SERVICE} --region=${REGION}"
echo "  Frontend Logs: gcloud run logs tail ${FRONTEND_SERVICE} --region=${REGION}"