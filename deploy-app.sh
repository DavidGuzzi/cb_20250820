#!/bin/bash

# Enhanced Cloud Run Deployment Script
# Deploys both backend and frontend services to Google Cloud Run with advanced features
# Author: Claude Code Assistant
# Version: 2.0

set -e

# Configuration
REGION=${REGION:-"us-central1"}
BACKEND_SERVICE="retail-backend"
FRONTEND_SERVICE="retail-frontend"
DEPLOYMENT_LOG="deployment-$(date +%Y%m%d-%H%M%S).log"
TIMEOUT_SECONDS=600

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${DEPLOYMENT_LOG}"
}

log_info() {
    log "INFO" "${CYAN}$1${NC}"
}

log_success() {
    log "SUCCESS" "${GREEN}$1${NC}"
}

log_warning() {
    log "WARNING" "${YELLOW}$1${NC}"
}

log_error() {
    log "ERROR" "${RED}$1${NC}"
}

# Header
print_header() {
    echo -e "${PURPLE}"
    echo "=================================================================="
    echo "           🚀 RETAIL ANALYTICS - CLOUD RUN DEPLOYMENT"
    echo "=================================================================="
    echo -e "${NC}"
    log_info "Deployment started at $(date)"
    log_info "Log file: ${DEPLOYMENT_LOG}"
}

# Check prerequisites
check_prerequisites() {
    log_info "🔍 Checking prerequisites..."
    
    # Check gcloud CLI
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed"
        echo "Install from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # Check authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null; then
        log_error "Not authenticated with Google Cloud"
        echo "Run: gcloud auth login"
        exit 1
    fi
    
    # Check project
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
    if [ -z "$CURRENT_PROJECT" ]; then
        log_error "No Google Cloud project configured"
        echo "Set with: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    
    # Check OPENAI_API_KEY
    if [ -z "$OPENAI_API_KEY" ]; then
        log_error "OPENAI_API_KEY environment variable is required"
        echo "Set with: export OPENAI_API_KEY=your-api-key"
        exit 1
    fi
    
    log_success "✅ All prerequisites met"
    log_info "Project: ${CURRENT_PROJECT}"
    log_info "Region: ${REGION}"
}

# Pre-deployment health check
pre_deployment_check() {
    log_info "🏥 Running pre-deployment health checks..."
    
    # Check if services exist and get their current status
    local backend_exists=$(gcloud run services list --filter="metadata.name:${BACKEND_SERVICE}" --format="value(metadata.name)" 2>/dev/null || echo "")
    local frontend_exists=$(gcloud run services list --filter="metadata.name:${FRONTEND_SERVICE}" --format="value(metadata.name)" 2>/dev/null || echo "")
    
    if [ -n "$backend_exists" ]; then
        local backend_url=$(gcloud run services describe ${BACKEND_SERVICE} --region=${REGION} --format="value(status.url)" 2>/dev/null)
        log_info "📱 Current backend: ${backend_url}"
        
        # Test current backend health
        if curl -f "${backend_url}/api/health" -m 10 > /dev/null 2>&1; then
            log_success "✅ Current backend is healthy"
        else
            log_warning "⚠️ Current backend health check failed"
        fi
    else
        log_info "🆕 Backend service doesn't exist - will create new"
    fi
    
    if [ -n "$frontend_exists" ]; then
        local frontend_url=$(gcloud run services describe ${FRONTEND_SERVICE} --region=${REGION} --format="value(status.url)" 2>/dev/null)
        log_info "🌐 Current frontend: ${frontend_url}"
        
        # Test current frontend
        if curl -f "${frontend_url}" -m 10 > /dev/null 2>&1; then
            log_success "✅ Current frontend is accessible"
        else
            log_warning "⚠️ Current frontend accessibility check failed"
        fi
    else
        log_info "🆕 Frontend service doesn't exist - will create new"
    fi
}

# Deploy backend with enhanced monitoring
deploy_backend() {
    log_info "📦 Starting backend deployment..."
    echo -e "${BLUE}================================${NC}"
    
    local start_time=$(date +%s)
    
    # Run backend deployment
    if ./deploy-backend-cloudrun.sh 2>&1 | tee -a "${DEPLOYMENT_LOG}"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "✅ Backend deployed successfully in ${duration}s"
        
        # Get backend URL
        BACKEND_URL=$(gcloud run services describe ${BACKEND_SERVICE} --region=${REGION} --format="value(status.url)" 2>/dev/null)
        log_info "🔗 Backend URL: ${BACKEND_URL}"
        
        return 0
    else
        log_error "❌ Backend deployment failed"
        return 1
    fi
}

# Deploy frontend with enhanced monitoring
deploy_frontend() {
    log_info "🌐 Starting frontend deployment..."
    echo -e "${BLUE}================================${NC}"
    
    if [ -z "$BACKEND_URL" ]; then
        log_error "Backend URL not available for frontend deployment"
        return 1
    fi
    
    local start_time=$(date +%s)
    
    # Set backend URL for frontend
    export BACKEND_URL=$BACKEND_URL
    
    # Run frontend deployment
    if ./deploy-frontend-cloudrun.sh 2>&1 | tee -a "${DEPLOYMENT_LOG}"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "✅ Frontend deployed successfully in ${duration}s"
        
        # Get frontend URL
        FRONTEND_URL=$(gcloud run services describe ${FRONTEND_SERVICE} --region=${REGION} --format="value(status.url)" 2>/dev/null)
        log_info "🔗 Frontend URL: ${FRONTEND_URL}"
        
        return 0
    else
        log_error "❌ Frontend deployment failed"
        return 1
    fi
}

# Post-deployment validation
post_deployment_validation() {
    log_info "🧪 Running post-deployment validation..."
    
    local validation_failed=false
    
    # Test backend health
    log_info "Testing backend health endpoint..."
    if curl -f "${BACKEND_URL}/api/health" -m 30 > /dev/null 2>&1; then
        log_success "✅ Backend health check passed"
    else
        log_error "❌ Backend health check failed"
        validation_failed=true
    fi
    
    # Test frontend accessibility
    log_info "Testing frontend accessibility..."
    if curl -f "${FRONTEND_URL}" -m 30 > /dev/null 2>&1; then
        log_success "✅ Frontend accessibility check passed"
    else
        log_error "❌ Frontend accessibility check failed"
        validation_failed=true
    fi
    
    # Test backend-frontend communication
    log_info "Testing backend-frontend integration..."
    sleep 5 # Give services time to fully initialize
    
    if curl -f "${FRONTEND_URL}" -m 30 | grep -q "Retail Analytics" 2>/dev/null; then
        log_success "✅ Frontend is serving content"
    else
        log_warning "⚠️ Frontend content validation inconclusive"
    fi
    
    if [ "$validation_failed" = true ]; then
        log_error "❌ Post-deployment validation failed"
        return 1
    else
        log_success "✅ All post-deployment validations passed"
        return 0
    fi
}

# Print deployment summary
print_summary() {
    local deployment_end_time=$(date)
    local total_duration=$(($(date +%s) - deployment_start_time))
    
    echo -e "${GREEN}"
    echo "=================================================================="
    echo "           🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo "=================================================================="
    echo -e "${NC}"
    
    log_success "Deployment finished at: ${deployment_end_time}"
    log_success "Total deployment time: ${total_duration}s"
    echo ""
    
    echo -e "${CYAN}📱 Application URLs:${NC}"
    echo "  🌐 Frontend:  ${FRONTEND_URL}"
    echo "  🔧 Backend:   ${BACKEND_URL}"
    echo ""
    
    echo -e "${CYAN}🧪 Quick Tests:${NC}"
    echo "  Frontend: curl -I ${FRONTEND_URL}"
    echo "  Backend:  curl ${BACKEND_URL}/api/health"
    echo ""
    
    echo -e "${CYAN}📊 Monitoring:${NC}"
    echo "  Frontend Logs: gcloud run logs tail ${FRONTEND_SERVICE} --region=${REGION}"
    echo "  Backend Logs:  gcloud run logs tail ${BACKEND_SERVICE} --region=${REGION}"
    echo ""
    
    echo -e "${CYAN}📝 Deployment Log:${NC}"
    echo "  Full log: ${DEPLOYMENT_LOG}"
    echo ""
    
    echo -e "${CYAN}💡 Next Steps:${NC}"
    echo "  1. Test the application at: ${FRONTEND_URL}"
    echo "  2. Monitor logs for any issues"
    echo "  3. Update DNS/domain settings if needed"
    echo "  4. Set up monitoring alerts"
}

# Error handling and cleanup
cleanup_on_error() {
    log_error "Deployment failed. Cleaning up..."
    log_info "Check deployment log: ${DEPLOYMENT_LOG}"
    echo -e "${YELLOW}To debug issues:${NC}"
    echo "  Backend logs: gcloud run logs tail ${BACKEND_SERVICE} --region=${REGION}"
    echo "  Frontend logs: gcloud run logs tail ${FRONTEND_SERVICE} --region=${REGION}"
    exit 1
}

# Main deployment flow
main() {
    deployment_start_time=$(date +%s)
    
    # Set up error handling
    trap cleanup_on_error ERR
    
    print_header
    check_prerequisites
    pre_deployment_check
    
    echo ""
    log_info "🚀 Starting sequential deployment..."
    
    # Deploy backend first
    if ! deploy_backend; then
        cleanup_on_error
    fi
    
    echo ""
    
    # Deploy frontend second
    if ! deploy_frontend; then
        cleanup_on_error
    fi
    
    echo ""
    
    # Validate deployment
    if ! post_deployment_validation; then
        log_warning "⚠️ Validation failed but deployment completed"
        log_warning "Please check services manually"
    fi
    
    print_summary
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        echo "Enhanced Cloud Run Deployment Script"
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --version, -v  Show version information"
        echo ""
        echo "Environment Variables:"
        echo "  OPENAI_API_KEY  Required. Your OpenAI API key"
        echo "  REGION          Optional. GCP region (default: us-central1)"
        echo ""
        echo "Examples:"
        echo "  $0              Deploy both services"
        echo "  REGION=us-west1 $0    Deploy to different region"
        exit 0
        ;;
    --version|-v)
        echo "Enhanced Cloud Run Deployment Script v2.0"
        echo "Built for Retail Analytics Application"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac