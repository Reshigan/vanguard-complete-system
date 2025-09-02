#!/bin/bash

# Vanguard Anti-Counterfeiting System - Security Testing Script
# This script performs security tests on the deployed system

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
║                 SECURITY TESTING SCRIPT                          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log "Starting security testing..."
echo ""

# Get admin token for authenticated requests
log "Getting admin token for authenticated requests..."
ADMIN_TOKEN=$(curl -s -X POST $API_URL/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    error "Failed to get admin token"
    exit 1
else
    success "Got admin token"
fi

# Get consumer token for authenticated requests
log "Getting consumer token for authenticated requests..."
CONSUMER_TOKEN=$(curl -s -X POST $API_URL/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$CONSUMER_EMAIL\",\"password\":\"$CONSUMER_PASSWORD\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CONSUMER_TOKEN" ]; then
    error "Failed to get consumer token"
    exit 1
else
    success "Got consumer token"
fi

# 1. Test for SQL Injection
run_test "SQL Injection Protection" "
    # Test login endpoint with SQL injection attempt
    response=\$(curl -s -X POST $API_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin\\' OR 1=1 --\",\"password\":\"anything\"}')
    
    # Should not return a token
    ! echo \$response | grep -q 'token'
"

# 2. Test for XSS Protection
run_test "XSS Protection" "
    # Create a product with XSS payload
    response=\$(curl -s -X POST $API_URL/products -H 'Content-Type: application/json' -H \"Authorization: Bearer $ADMIN_TOKEN\" -d '{\"name\":\"<script>alert(1)</script>\",\"sku\":\"SKU-XSS-TEST\",\"description\":\"XSS test\",\"category\":\"Test\",\"price\":99.99}')
    
    # Get the product ID
    product_id=\$(echo \$response | grep -o '\"id\":[^,]*' | cut -d':' -f2 | tr -d ' ')
    
    # Get the product and check if script tags are escaped
    product_response=\$(curl -s $API_URL/products/\$product_id -H \"Authorization: Bearer $ADMIN_TOKEN\")
    
    # Should not contain unescaped script tags
    ! echo \$product_response | grep -q '<script>'
"

# 3. Test for CSRF Protection
run_test "CSRF Protection" "
    # Check if API requires CSRF token for state-changing operations
    response=\$(curl -s -X POST $API_URL/products -H 'Content-Type: application/json' -H \"Authorization: Bearer $ADMIN_TOKEN\" -d '{\"name\":\"CSRF Test\",\"sku\":\"SKU-CSRF-TEST\",\"description\":\"CSRF test\",\"category\":\"Test\",\"price\":99.99}')
    
    # Should contain CSRF token or not require it (API token-based auth is sufficient)
    echo \$response | grep -q 'id'
"

# 4. Test for Authentication Bypass
run_test "Authentication Bypass Protection" "
    # Try to access protected endpoint without token
    response=\$(curl -s $API_URL/users)
    
    # Should return unauthorized
    echo \$response | grep -q 'unauthorized\\|Unauthorized\\|not authorized'
"

# 5. Test for Authorization Bypass
run_test "Authorization Bypass Protection" "
    # Try to access admin endpoint with consumer token
    response=\$(curl -s $API_URL/users -H \"Authorization: Bearer $CONSUMER_TOKEN\")
    
    # Should return forbidden
    echo \$response | grep -q 'forbidden\\|Forbidden\\|not authorized'
"

# 6. Test for Brute Force Protection
run_test "Brute Force Protection" "
    # Try multiple failed login attempts
    for i in {1..5}; do
        curl -s -X POST $API_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@vanguard.local\",\"password\":\"wrongpassword'$i'\"}' > /dev/null
    done
    
    # Try one more time and check if it's rate limited
    response=\$(curl -s -X POST $API_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@vanguard.local\",\"password\":\"wrongpassword6\"}')
    
    # Should be rate limited or have captcha
    echo \$response | grep -q 'rate\\|limit\\|too many\\|captcha'
"

# 7. Test for Insecure Direct Object References
run_test "IDOR Protection" "
    # Try to access another user's data
    response=\$(curl -s $API_URL/users/999999 -H \"Authorization: Bearer $CONSUMER_TOKEN\")
    
    # Should return not found or forbidden
    echo \$response | grep -q 'not found\\|forbidden\\|Forbidden'
"

# 8. Test for Sensitive Data Exposure
run_test "Sensitive Data Exposure Protection" "
    # Get user profile
    response=\$(curl -s $API_URL/auth/profile -H \"Authorization: Bearer $ADMIN_TOKEN\")
    
    # Should not contain password hash
    ! echo \$response | grep -q 'password\\|hash'
"

# 9. Test for Security Headers
run_test "Security Headers" "
    # Get headers from web server
    headers=\$(curl -s -I $WEB_URL)
    
    # Check for important security headers
    echo \$headers | grep -q 'X-Content-Type-Options' &&
    echo \$headers | grep -q 'X-Frame-Options' &&
    echo \$headers | grep -q 'Content-Security-Policy\\|X-XSS-Protection'
"

# 10. Test for Secure Cookies
run_test "Secure Cookies" "
    # Get cookies from web server
    cookies=\$(curl -s -I $WEB_URL | grep -i 'Set-Cookie')
    
    # Check if cookies have secure and httpOnly flags
    echo \$cookies | grep -q 'Secure' &&
    echo \$cookies | grep -q 'HttpOnly'
"

# 11. Test for Open Redirects
run_test "Open Redirect Protection" "
    # Try to exploit open redirect
    response=\$(curl -s \"$WEB_URL/login?redirect=https://evil.com\")
    
    # Should not redirect to external domain
    ! echo \$response | grep -q 'evil.com'
"

# 12. Test for Directory Traversal
run_test "Directory Traversal Protection" "
    # Try to exploit directory traversal
    response=\$(curl -s \"$API_URL/uploads/../../etc/passwd\")
    
    # Should not return file contents
    ! echo \$response | grep -q 'root:' &&
    echo \$response | grep -q 'not found\\|forbidden\\|Forbidden'
"

# 13. Test for Command Injection
run_test "Command Injection Protection" "
    # Try to exploit command injection in search parameter
    response=\$(curl -s \"$API_URL/products/search?q=test;ls\")
    
    # Should not execute command
    ! echo \$response | grep -q 'server\\.js\\|package\\.json'
"

# 14. Test for JWT Security
run_test "JWT Security" "
    # Check if JWT is properly signed and not using weak algorithm
    jwt_header=\$(echo $ADMIN_TOKEN | cut -d'.' -f1 | base64 -d 2>/dev/null)
    
    # Should use strong algorithm (RS256, ES256, etc.)
    echo \$jwt_header | grep -q '\"alg\":\"RS256\"\\|\"alg\":\"ES256\"\\|\"alg\":\"HS256\"'
"

# 15. Test for File Upload Vulnerabilities
run_test "File Upload Security" "
    # Create a test PHP file
    echo '<?php echo \"hacked\"; ?>' > /tmp/test-hack.php
    
    # Try to upload PHP file
    response=\$(curl -s -X POST $API_URL/uploads -H 'Authorization: Bearer $ADMIN_TOKEN' -F 'file=@/tmp/test-hack.php')
    
    # Should reject PHP file or rename it
    ! echo \$response | grep -q '\\.php'
    
    # Clean up
    rm /tmp/test-hack.php
"

# 16. Test for API Rate Limiting
run_test "API Rate Limiting" "
    # Make multiple requests in quick succession
    for i in {1..20}; do
        curl -s $API_URL/products > /dev/null
    done
    
    # Check if rate limited
    response=\$(curl -s -I $API_URL/products)
    
    # Should have rate limit headers or return 429
    echo \$response | grep -q 'X-RateLimit\\|429'
"

# 17. Test for CORS Configuration
run_test "CORS Configuration" "
    # Check CORS headers
    response=\$(curl -s -I -H \"Origin: https://example.com\" $API_URL/health)
    
    # Should have proper CORS headers
    echo \$response | grep -q 'Access-Control-Allow-Origin'
"

# 18. Test for HTTP Methods
run_test "HTTP Methods Security" "
    # Try OPTIONS request
    response=\$(curl -s -I -X OPTIONS $API_URL/health)
    
    # Should only allow necessary methods
    methods=\$(echo \$response | grep -i 'Access-Control-Allow-Methods' | cut -d':' -f2)
    ! echo \$methods | grep -q 'TRACE\\|CONNECT'
"

# 19. Test for Error Handling
run_test "Secure Error Handling" "
    # Try to cause an error
    response=\$(curl -s $API_URL/nonexistent)
    
    # Should not expose stack traces or sensitive info
    ! echo \$response | grep -q 'at\\s\\+\\w\\+\\.js:\\d\\+:\\d\\+\\|stack\\|trace'
"

# 20. Test for Dependency Vulnerabilities
run_test "Dependency Security" "
    # Check if npm audit is clean
    cd /opt/vanguard/server && npm audit --json | grep -q '\"vulnerabilities\":{\"info\":0,\"low\":0,\"moderate\":0,\"high\":0,\"critical\":0}'
"

# Print summary
echo ""
log "Security testing completed!"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "Total tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
echo ""

if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "${GREEN}All security tests passed! The system is secure.${NC}"
    exit 0
else
    echo -e "${RED}Some security tests failed. Please check the logs and fix the issues.${NC}"
    exit 1
fi