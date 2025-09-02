#!/bin/bash

# Vanguard Anti-Counterfeiting System - Comprehensive Test Runner
# This script runs all tests to ensure the system is fully functional

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Print banner
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║  ██╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██████╗  ║
║  ██║   ██║██╔══██╗████╗  ██║██╔════╝ ██║   ██║██╔══██╗██╔══██╗ ║
║  ██║   ██║███████║██╔██╗ ██║██║  ███╗██║   ██║███████║██████╔╝ ║
║  ╚██╗ ██╔╝██╔══██║██║╚██╗██║██║   ██║██║   ██║██╔══██║██╔══██╗ ║
║   ╚████╔╝ ██║  ██║██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║ ║
║    ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ║
║                                                                  ║
║                COMPREHENSIVE TEST RUNNER                         ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Variables to track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test suite
run_test_suite() {
    local suite_name="$1"
    local test_command="$2"
    
    log "Running test suite: $suite_name"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo "-------------------------------------------------------------"
    echo "Starting: $suite_name"
    echo "-------------------------------------------------------------"
    
    if eval "$test_command"; then
        success "Test suite passed: $suite_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        error "Test suite failed: $suite_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo "-------------------------------------------------------------"
    echo "Completed: $suite_name"
    echo "-------------------------------------------------------------"
    echo ""
}

# Check if the system is running
log "Checking if the system is running..."
if ! curl -s http://localhost:3000/api/health | grep -q 'ok'; then
    error "The system is not running. Please start it before running tests."
    exit 1
fi
success "System is running"
echo ""

# 1. Run backend API tests
run_test_suite "Backend API Tests" "
    cd /workspace/vanguard-complete-system/server && 
    npm test
"

# 2. Run frontend UI tests
run_test_suite "Frontend UI Tests" "
    cd /workspace/vanguard-complete-system/client && 
    npm test
"

# 3. Run integration tests
run_test_suite "Integration Tests" "
    cd /workspace/vanguard-complete-system && 
    npm run test:integration
"

# 4. Run deployment verification
run_test_suite "Deployment Verification" "
    cd /workspace/vanguard-complete-system && 
    bash deploy/verify-deployment.sh
"

# 5. Run security tests
run_test_suite "Security Tests" "
    cd /workspace/vanguard-complete-system && 
    bash security/security-test.sh
"

# 6. Run performance tests (smoke test only)
run_test_suite "Performance Tests (Smoke)" "
    cd /workspace/vanguard-complete-system && 
    k6 run --tag scenario=smoke performance/load-test.js
"

# 7. Run database migration tests
run_test_suite "Database Migration Tests" "
    cd /workspace/vanguard-complete-system/server && 
    npm run test:migrations
"

# 8. Run ML model tests
run_test_suite "ML Model Tests" "
    cd /workspace/vanguard-complete-system/server/workers && 
    npm test
"

# Print summary
echo ""
log "All tests completed!"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "Total test suites: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
echo ""

if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "${GREEN}All test suites passed! The system is fully functional and ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}Some test suites failed. Please check the logs and fix the issues before deployment.${NC}"
    exit 1
fi