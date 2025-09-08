#!/bin/bash

# Application Rollback Script
# Quickly rollback to previous revision if deployment fails

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

show_help() {
    echo "Application Rollback Script"
    echo "Usage: $0 [OPTIONS] [SERVICE]"
    echo ""
    echo "Options:"
    echo "  --help, -h      Show this help"
    echo "  --list, -l      List available revisions"
    echo "  --dry-run       Show what would be rolled back"
    echo ""
    echo "Services:"
    echo "  backend         Rollback backend only"
    echo "  frontend        Rollback frontend only"
    echo "  both (default)  Rollback both services"
    echo ""
    echo "Examples:"
    echo "  $0              Rollback both services"
    echo "  $0 backend      Rollback backend only"
    echo "  $0 --list       List all revisions"
}

list_revisions() {
    local service_name=$1
    local service_type=$2
    
    echo -e "${CYAN}${service_type} Revisions (${service_name}):${NC}"
    echo "----------------------------------------"
    
    gcloud run revisions list \
        --service=${service_name} \
        --region=${REGION} \
        --limit=5 \
        --format="table(
            metadata.name:label='REVISION',
            status.conditions[0].lastTransitionTime.date('%Y-%m-%d %H:%M'):label='DEPLOYED',
            status.observedGeneration:label='GEN',
            spec.template.metadata.annotations.run\.googleapis\.com/cpu-throttling:label='CPU',
            status.allocatedTraffic[0].percent:label='TRAFFIC%'
        )" 2>/dev/null || {
        echo -e "${RED}❌ Service not found or no revisions${NC}"
    }
    echo ""
}

rollback_service() {
    local service_name=$1
    local service_type=$2
    local dry_run=${3:-false}
    
    echo -e "${YELLOW}🔄 ${service_type} Rollback (${service_name})${NC}"
    echo "----------------------------------------"
    
    # Get current and previous revisions
    local revisions=($(gcloud run revisions list --service=${service_name} --region=${REGION} --limit=2 --format="value(metadata.name)" 2>/dev/null || echo ""))
    
    if [ ${#revisions[@]} -lt 2 ]; then
        echo -e "${RED}❌ Not enough revisions to rollback${NC}"
        echo "Available revisions: ${#revisions[@]}"
        return 1
    fi
    
    local current_revision=${revisions[0]}
    local previous_revision=${revisions[1]}
    
    echo -e "📋 Current:  ${current_revision}"
    echo -e "📋 Previous: ${previous_revision}"
    
    if [ "$dry_run" = true ]; then
        echo -e "${BLUE}[DRY RUN]${NC} Would rollback to: ${previous_revision}"
        return 0
    fi
    
    echo -e "${YELLOW}Rolling back to previous revision...${NC}"
    
    # Perform rollback by directing 100% traffic to previous revision
    if gcloud run services update-traffic ${service_name} \
        --to-revisions=${previous_revision}=100 \
        --region=${REGION} \
        --quiet; then
        
        echo -e "${GREEN}✅ Rollback completed${NC}"
        
        # Get service URL and test
        local service_url=$(gcloud run services describe ${service_name} --region=${REGION} --format="value(status.url)")
        echo -e "🔗 Service URL: ${service_url}"
        
        # Quick health check
        echo -n "🏥 Testing rollback: "
        sleep 5  # Give service time to update
        
        if [ "$service_type" = "Backend" ]; then
            if curl -f "${service_url}/api/health" -m 15 > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Healthy${NC}"
            else
                echo -e "${RED}❌ Health check failed${NC}"
                return 1
            fi
        else
            if curl -f "${service_url}" -m 15 > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Accessible${NC}"
            else
                echo -e "${RED}❌ Accessibility check failed${NC}"
                return 1
            fi
        fi
        
        return 0
    else
        echo -e "${RED}❌ Rollback failed${NC}"
        return 1
    fi
}

# Main script logic
main() {
    local command=""
    local service=""
    local dry_run=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit 0
                ;;
            --list|-l)
                command="list"
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            backend|frontend|both)
                service="$1"
                shift
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Default service is both
    if [ -z "$service" ]; then
        service="both"
    fi
    
    # Check prerequisites
    PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
    if [ -z "$PROJECT" ]; then
        echo -e "${RED}❌ No GCP project configured${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🔄 Application Rollback${NC}"
    echo "======================="
    echo -e "Project: ${PROJECT}"
    echo -e "Region: ${REGION}"
    echo -e "Service: ${service}"
    if [ "$dry_run" = true ]; then
        echo -e "Mode: ${BLUE}DRY RUN${NC}"
    fi
    echo ""
    
    # Execute command
    case $command in
        "list")
            if [ "$service" = "backend" ] || [ "$service" = "both" ]; then
                list_revisions ${BACKEND_SERVICE} "Backend"
            fi
            if [ "$service" = "frontend" ] || [ "$service" = "both" ]; then
                list_revisions ${FRONTEND_SERVICE} "Frontend"
            fi
            ;;
        *)
            # Default: perform rollback
            local success=true
            
            if [ "$service" = "backend" ] || [ "$service" = "both" ]; then
                if ! rollback_service ${BACKEND_SERVICE} "Backend" $dry_run; then
                    success=false
                fi
                echo ""
            fi
            
            if [ "$service" = "frontend" ] || [ "$service" = "both" ]; then
                if ! rollback_service ${FRONTEND_SERVICE} "Frontend" $dry_run; then
                    success=false
                fi
                echo ""
            fi
            
            if [ "$dry_run" = false ]; then
                if [ "$success" = true ]; then
                    echo -e "${GREEN}🎉 Rollback completed successfully!${NC}"
                    echo "Run './deployment-status.sh' to verify services"
                else
                    echo -e "${RED}❌ Rollback failed or partially failed${NC}"
                    echo "Check service logs for issues"
                    exit 1
                fi
            fi
            ;;
    esac
}

main "$@"