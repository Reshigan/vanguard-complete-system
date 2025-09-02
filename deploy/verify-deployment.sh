#!/bin/bash

# Vanguard Anti-Counterfeiting System - Deployment Verification Script
# This script verifies that all components of the system are working correctly after deployment

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

# Configuration
API_URL="http://localhost:3000/api"
WEB_URL="http://localhost:3000"
ADMIN_EMAIL="admin@vanguard.local"
ADMIN_PASSWORD="Admin@123456"
CONSUMER_EMAIL="user@example.com"
CONSUMER_PASSWORD="password123"

# Variables to track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    log "Running test: $test_name"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        success "Test passed: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        error "Test failed: $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
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
║              DEPLOYMENT VERIFICATION SCRIPT                      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log "Starting deployment verification..."
echo ""

# 1. Check if server is running
run_test "Server is running" "curl -s $API_URL/health | grep -q 'ok'"

# 2. Check if web server is running
run_test "Web server is running" "curl -s $WEB_URL | grep -q '<title>'"

# 3. Check if database is connected
run_test "Database is connected" "curl -s $API_URL/health/db | grep -q 'connected'"

# 4. Check if Redis is connected
run_test "Redis is connected" "curl -s $API_URL/health/redis | grep -q 'connected'"

# 5. Check admin login
run_test "Admin login works" "
    response=\$(curl -s -X POST $API_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}')
    echo \$response | grep -q 'token'
"

# 6. Check consumer login
run_test "Consumer login works" "
    response=\$(curl -s -X POST $API_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"$CONSUMER_EMAIL\",\"password\":\"$CONSUMER_PASSWORD\"}')
    echo \$response | grep -q 'token'
"

# 7. Get admin token for authenticated requests
log "Getting admin token for authenticated requests..."
ADMIN_TOKEN=$(curl -s -X POST $API_URL/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    error "Failed to get admin token"
    exit 1
else
    success "Got admin token"
fi

# 8. Check if products API works
run_test "Products API works" "
    response=\$(curl -s $API_URL/products -H 'Authorization: Bearer $ADMIN_TOKEN')
    echo \$response | grep -q '\\['
"

# 9. Check if users API works
run_test "Users API works" "
    response=\$(curl -s $API_URL/users -H 'Authorization: Bearer $ADMIN_TOKEN')
    echo \$response | grep -q '\\['
"

# 10. Check if analytics API works
run_test "Analytics API works" "
    response=\$(curl -s $API_URL/analytics/verifications -H 'Authorization: Bearer $ADMIN_TOKEN')
    echo \$response | grep -q 'total'
"

# 11. Check if ML API works
run_test "ML API works" "
    response=\$(curl -s $API_URL/ml/anomalies -H 'Authorization: Bearer $ADMIN_TOKEN')
    echo \$response | grep -q '\\['
"

# 12. Create a test product
log "Creating a test product..."
PRODUCT_RESPONSE=$(curl -s -X POST $API_URL/products -H 'Content-Type: application/json' -H "Authorization: Bearer $ADMIN_TOKEN" -d '{"name":"Verification Test Product","sku":"SKU-TEST-VERIFY","description":"Product for verification testing","category":"Test","price":99.99}')
PRODUCT_ID=$(echo $PRODUCT_RESPONSE | grep -o '"id":[^,]*' | cut -d':' -f2 | tr -d ' ')

if [ -z "$PRODUCT_ID" ]; then
    error "Failed to create test product"
else
    success "Created test product with ID: $PRODUCT_ID"
fi

# 13. Generate tokens for the test product
log "Generating tokens for the test product..."
TOKENS_RESPONSE=$(curl -s -X POST $API_URL/tokens/generate -H 'Content-Type: application/json' -H "Authorization: Bearer $ADMIN_TOKEN" -d "{\"productId\":$PRODUCT_ID,\"quantity\":5}")
TEST_TOKEN=$(echo $TOKENS_RESPONSE | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TEST_TOKEN" ]; then
    error "Failed to generate tokens"
else
    success "Generated test token: $TEST_TOKEN"
fi

# 14. Verify the test token
run_test "Token verification works" "
    response=\$(curl -s -X POST $API_URL/verify -H 'Content-Type: application/json' -d '{\"token\":\"$TEST_TOKEN\"}')
    echo \$response | grep -q '\"valid\":true'
"

# 15. Check file uploads
run_test "File uploads work" "
    # Create a test file
    echo 'Test file content' > /tmp/test-upload.txt
    
    # Upload the file
    response=\$(curl -s -X POST $API_URL/uploads -H 'Authorization: Bearer $ADMIN_TOKEN' -F 'file=@/tmp/test-upload.txt')
    
    # Check if upload was successful
    echo \$response | grep -q 'url'
    
    # Clean up
    rm /tmp/test-upload.txt
"

# 16. Check system resources
log "Checking system resources..."

# Check CPU usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')
log "CPU Usage: ${CPU_USAGE}%"
if (( $(echo "$CPU_USAGE > 90" | bc -l) )); then
    warning "CPU usage is high (${CPU_USAGE}%)"
else
    success "CPU usage is normal (${CPU_USAGE}%)"
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
log "Memory Usage: ${MEM_USAGE}%"
if (( $(echo "$MEM_USAGE > 90" | bc -l) )); then
    warning "Memory usage is high (${MEM_USAGE}%)"
else
    success "Memory usage is normal (${MEM_USAGE}%)"
fi

# Check disk usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
log "Disk Usage: ${DISK_USAGE}%"
if [ "$DISK_USAGE" -gt 90 ]; then
    warning "Disk usage is high (${DISK_USAGE}%)"
else
    success "Disk usage is normal (${DISK_USAGE}%)"
fi

# 17. Check logs for errors
log "Checking logs for errors..."
ERROR_COUNT=$(grep -i "error\|exception\|fail" /var/log/vanguard/* 2>/dev/null | wc -l)
if [ "$ERROR_COUNT" -gt 0 ]; then
    warning "Found $ERROR_COUNT errors in logs"
else
    success "No errors found in logs"
fi

# 18. Check security
log "Checking security..."

# Check if HTTPS is enabled
if curl -s -I "$WEB_URL" | grep -q "HTTPS"; then
    success "HTTPS is enabled"
else
    warning "HTTPS is not enabled"
fi

# Check for common security headers
SECURITY_HEADERS=$(curl -s -I "$WEB_URL" | grep -i "X-Content-Type-Options\|X-Frame-Options\|Content-Security-Policy\|Strict-Transport-Security" | wc -l)
if [ "$SECURITY_HEADERS" -ge 3 ]; then
    success "Security headers are properly configured"
else
    warning "Some security headers are missing"
fi

# Print summary
echo ""
log "Verification completed!"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "Total tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
echo ""

if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "${GREEN}All tests passed! The deployment is verified.${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the logs and fix the issues.${NC}"
    exit 1
fi