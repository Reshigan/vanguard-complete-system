/**
 * Performance Testing Script for Vanguard Anti-Counterfeiting System
 * 
 * This script uses k6 (https://k6.io/) to perform load testing on the system.
 * It tests various API endpoints under different load scenarios.
 * 
 * Usage:
 * 1. Install k6: https://k6.io/docs/getting-started/installation/
 * 2. Run the test: k6 run load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('error_rate');
const authenticationTrend = new Trend('authentication_duration');
const verificationTrend = new Trend('verification_duration');
const productsTrend = new Trend('products_duration');
const analyticsTrend = new Trend('analytics_duration');

// Configuration
const API_URL = 'http://localhost:3000/api';
const ADMIN_USER = {
  email: 'admin@vanguard.local',
  password: 'Admin@123456'
};
const CONSUMER_USER = {
  email: 'user@example.com',
  password: 'password123'
};

// Test data
const testTokens = new SharedArray('tokens', function() {
  return [
    'TOKEN-1-0',
    'TOKEN-2-0',
    'TOKEN-3-0',
    'INVALID-TOKEN-1',
    'INVALID-TOKEN-2'
  ];
});

// Load test scenarios
export const options = {
  scenarios: {
    // Smoke test - low load to verify system works
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { scenario: 'smoke' },
    },
    // Load test - moderate load to test normal operation
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '3m', target: 10 },
        { duration: '1m', target: 0 },
      ],
      tags: { scenario: 'load' },
    },
    // Stress test - high load to find breaking points
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '3m', target: 20 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 0 },
      ],
      tags: { scenario: 'stress' },
    },
    // Spike test - sudden surge in traffic
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 0 },
        { duration: '20s', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '20s', target: 0 },
      ],
      tags: { scenario: 'spike' },
    },
    // Soak test - long duration to find memory leaks
    soak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 5 },
        { duration: '5m', target: 5 },
        { duration: '1m', target: 0 },
      ],
      tags: { scenario: 'soak' },
    },
  },
  thresholds: {
    // Define performance thresholds
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_failed': ['rate<0.05'],   // Less than 5% of requests should fail
    'authentication_duration': ['p(95)<300'], // 95% of auth requests should be below 300ms
    'verification_duration': ['p(95)<200'],   // 95% of verification requests should be below 200ms
    'products_duration': ['p(95)<300'],       // 95% of product requests should be below 300ms
    'analytics_duration': ['p(95)<500'],      // 95% of analytics requests should be below 500ms
  },
};

// Setup function - runs once per VU
export function setup() {
  // Login as admin and consumer to get tokens
  const adminLoginRes = http.post(`${API_URL}/auth/login`, JSON.stringify(ADMIN_USER), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const consumerLoginRes = http.post(`${API_URL}/auth/login`, JSON.stringify(CONSUMER_USER), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(adminLoginRes, {
    'admin login successful': (r) => r.status === 200 && r.json('token') !== undefined,
  });
  
  check(consumerLoginRes, {
    'consumer login successful': (r) => r.status === 200 && r.json('token') !== undefined,
  });
  
  // Return tokens for use in tests
  return {
    adminToken: adminLoginRes.json('token'),
    consumerToken: consumerLoginRes.json('token'),
  };
}

// Default function - main test logic
export default function(data) {
  const { adminToken, consumerToken } = data;
  
  // Randomly select user type for this iteration
  const isAdmin = Math.random() < 0.3; // 30% admin, 70% consumer
  const token = isAdmin ? adminToken : consumerToken;
  
  group('Authentication', function() {
    // Test login performance
    const loginStart = new Date();
    const loginRes = http.post(`${API_URL}/auth/login`, JSON.stringify(
      isAdmin ? ADMIN_USER : CONSUMER_USER
    ), {
      headers: { 'Content-Type': 'application/json' },
    });
    const loginDuration = new Date() - loginStart;
    
    authenticationTrend.add(loginDuration);
    
    check(loginRes, {
      'login successful': (r) => r.status === 200 && r.json('token') !== undefined,
    }) || errorRate.add(1);
    
    // Test profile retrieval
    const profileRes = http.get(`${API_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    check(profileRes, {
      'profile retrieval successful': (r) => r.status === 200 && r.json('email') !== undefined,
    }) || errorRate.add(1);
    
    sleep(1);
  });
  
  group('Product Verification', function() {
    // Test token verification
    const randomToken = randomItem(testTokens);
    
    const verifyStart = new Date();
    const verifyRes = http.post(`${API_URL}/verify`, JSON.stringify({
      token: randomToken,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    const verifyDuration = new Date() - verifyStart;
    
    verificationTrend.add(verifyDuration);
    
    check(verifyRes, {
      'verification response received': (r) => r.status === 200,
      'verification contains valid property': (r) => r.json('valid') !== undefined,
    }) || errorRate.add(1);
    
    sleep(1);
  });
  
  group('Product Management', function() {
    // Test product listing
    const productsStart = new Date();
    const productsRes = http.get(`${API_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const productsDuration = new Date() - productsStart;
    
    productsTrend.add(productsDuration);
    
    check(productsRes, {
      'products listing successful': (r) => r.status === 200 && Array.isArray(r.json()),
    }) || errorRate.add(1);
    
    // If admin, test product creation
    if (isAdmin) {
      const createRes = http.post(`${API_URL}/products`, JSON.stringify({
        name: `Load Test Product ${Date.now()}`,
        sku: `SKU-LOAD-${Date.now()}`,
        description: 'Product created during load testing',
        category: 'Test',
        price: 99.99
      }), {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      check(createRes, {
        'product creation successful': (r) => r.status === 201 && r.json('id') !== undefined,
      }) || errorRate.add(1);
    }
    
    sleep(1);
  });
  
  group('Analytics', function() {
    // Only test analytics for admin users
    if (isAdmin) {
      const analyticsStart = new Date();
      const analyticsRes = http.get(`${API_URL}/analytics/verifications`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });
      const analyticsDuration = new Date() - analyticsStart;
      
      analyticsTrend.add(analyticsDuration);
      
      check(analyticsRes, {
        'analytics retrieval successful': (r) => r.status === 200 && r.json('total') !== undefined,
      }) || errorRate.add(1);
      
      // Test ML analytics
      const mlRes = http.get(`${API_URL}/ml/anomalies`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      check(mlRes, {
        'ML analytics retrieval successful': (r) => r.status === 200 && Array.isArray(r.json()),
      }) || errorRate.add(1);
    }
    
    sleep(1);
  });
  
  // Random sleep between requests to simulate real user behavior
  sleep(Math.random() * 3);
}

// Teardown function - runs once at the end
export function teardown(data) {
  // Logout or cleanup if needed
  console.log('Load test completed');
}