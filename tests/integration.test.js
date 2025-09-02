/**
 * Integration Testing Suite for Vanguard Anti-Counterfeiting System
 * 
 * This test suite verifies the integration between frontend and backend:
 * - End-to-end authentication flows
 * - Product verification process
 * - Data consistency between frontend and backend
 * - Error handling and validation
 */

const { chromium } = require('playwright');
const axios = require('axios');
const { expect } = require('chai');

// Configuration
const config = {
  apiUrl: 'http://localhost:3000/api',
  webUrl: 'http://localhost:3000',
  adminUser: {
    email: 'admin@vanguard.local',
    password: 'Admin@123456'
  },
  consumerUser: {
    email: 'user@example.com',
    password: 'password123'
  }
};

// Store tokens and data for tests
let adminToken;
let consumerToken;
let testProduct;
let testToken;

describe('Vanguard Integration Tests', function() {
  this.timeout(30000); // Increase timeout for browser tests
  
  let browser;
  let adminContext;
  let consumerContext;
  
  before(async () => {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
      slowMo: 50
    });
    
    // Create contexts for different users
    adminContext = await browser.newContext();
    consumerContext = await browser.newContext();
    
    // Login and get tokens
    try {
      const adminResponse = await axios.post(`${config.apiUrl}/auth/login`, config.adminUser);
      adminToken = adminResponse.data.token;
      
      const consumerResponse = await axios.post(`${config.apiUrl}/auth/login`, config.consumerUser);
      consumerToken = consumerResponse.data.token;
    } catch (error) {
      console.error('Error during setup:', error.message);
    }
  });
  
  after(async () => {
    // Close browser
    await browser.close();
  });
  
  // Authentication Integration Tests
  describe('Authentication Integration', () => {
    it('should login as admin via UI and access admin dashboard', async () => {
      const page = await adminContext.newPage();
      await page.goto(`${config.webUrl}/login`);
      
      // Fill login form
      await page.fill('input[name="email"]', config.adminUser.email);
      await page.fill('input[name="password"]', config.adminUser.password);
      await page.click('button[type="submit"]');
      
      // Wait for dashboard to load
      await page.waitForSelector('text=Dashboard');
      
      // Check if admin dashboard is displayed
      const dashboardTitle = await page.textContent('h1, h2, h3, h4, h5, h6');
      expect(dashboardTitle).to.include('Dashboard');
      
      await page.close();
    });
    
    it('should login as consumer via UI and access consumer homepage', async () => {
      const page = await consumerContext.newPage();
      await page.goto(`${config.webUrl}/login`);
      
      // Fill login form
      await page.fill('input[name="email"]', config.consumerUser.email);
      await page.fill('input[name="password"]', config.consumerUser.password);
      await page.click('button[type="submit"]');
      
      // Wait for homepage to load
      await page.waitForSelector('text=Scan Product');
      
      // Check if consumer homepage is displayed
      const scanButton = await page.textContent('button:has-text("Scan Product")');
      expect(scanButton).to.include('Scan Product');
      
      await page.close();
    });
  });
  
  // Product Management Integration Tests
  describe('Product Management Integration', () => {
    it('should create a product via API and see it in the UI', async () => {
      // Create product via API
      const productData = {
        name: 'Integration Test Product',
        sku: `SKU-INT-${Date.now()}`,
        description: 'Product created during integration testing',
        category: 'Test',
        price: 99.99
      };
      
      const response = await axios.post(`${config.apiUrl}/products`, productData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      testProduct = response.data;
      expect(testProduct).to.have.property('id');
      expect(testProduct.name).to.equal(productData.name);
      
      // Check if product appears in UI
      const page = await adminContext.newPage();
      await page.goto(`${config.webUrl}/dashboard`);
      
      // Navigate to products page
      await page.click('text=Products');
      
      // Wait for products to load and check if our test product is there
      await page.waitForSelector(`text=${productData.name}`);
      
      const productElement = await page.textContent(`text=${productData.name}`);
      expect(productElement).to.include(productData.name);
      
      await page.close();
    });
    
    it('should generate authentication tokens for the product', async () => {
      // Generate tokens via API
      const tokenData = {
        productId: testProduct.id,
        quantity: 5
      };
      
      const response = await axios.post(`${config.apiUrl}/tokens/generate`, tokenData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const tokens = response.data;
      expect(tokens).to.be.an('array');
      expect(tokens.length).to.equal(5);
      
      testToken = tokens[0];
      expect(testToken).to.have.property('token');
      
      // Check if tokens appear in UI
      const page = await adminContext.newPage();
      await page.goto(`${config.webUrl}/dashboard`);
      
      // Navigate to authentication page
      await page.click('text=Authentication');
      
      // Wait for tokens to load and check if our test token is there
      await page.waitForSelector(`text=${testToken.token}`);
      
      const tokenElement = await page.textContent(`text=${testToken.token}`);
      expect(tokenElement).to.include(testToken.token);
      
      await page.close();
    });
  });
  
  // Verification Process Integration Tests
  describe('Verification Process Integration', () => {
    it('should verify a valid token via consumer UI', async () => {
      const page = await consumerContext.newPage();
      await page.goto(`${config.webUrl}/scan`);
      
      // Switch to manual entry
      await page.click('text=Manual Entry');
      
      // Enter token
      await page.fill('input[placeholder*="token"]', testToken.token);
      
      // Click verify
      await page.click('text=Verify Product');
      
      // Wait for verification result
      await page.waitForSelector('text=Verification Result');
      
      // Check if product is authentic
      const resultText = await page.textContent('text=Authentic Product');
      expect(resultText).to.include('Authentic Product');
      
      await page.close();
    });
    
    it('should record verification in the database and show in analytics', async () => {
      // Wait a moment for the verification to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check analytics via API
      const response = await axios.get(`${config.apiUrl}/analytics/verifications`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const analytics = response.data;
      expect(analytics).to.have.property('total');
      expect(analytics.total).to.be.at.least(1);
      
      // Check if verification appears in UI
      const page = await adminContext.newPage();
      await page.goto(`${config.webUrl}/dashboard`);
      
      // Navigate to analytics page
      await page.click('text=Analytics');
      
      // Wait for analytics to load
      await page.waitForSelector('text=Verification Statistics');
      
      // Check if our product appears in recent verifications
      await page.waitForSelector(`text=${testProduct.name}`);
      
      await page.close();
    });
  });
  
  // Reporting System Integration Tests
  describe('Reporting System Integration', () => {
    it('should report a counterfeit product via consumer UI', async () => {
      const page = await consumerContext.newPage();
      await page.goto(`${config.webUrl}/scan`);
      
      // Switch to manual entry
      await page.click('text=Manual Entry');
      
      // Enter a fake token
      await page.fill('input[placeholder*="token"]', 'FAKE-TOKEN-12345');
      
      // Click verify
      await page.click('text=Verify Product');
      
      // Wait for verification result
      await page.waitForSelector('text=Counterfeit Product');
      
      // Click report button
      await page.click('text=Report Counterfeit');
      
      // Fill report form
      await page.fill('textarea[placeholder*="description"]', 'Integration test report');
      await page.click('text=Submit Report');
      
      // Check for success message
      await page.waitForSelector('text=Thank you for your report');
      
      await page.close();
    });
    
    it('should show the report in admin dashboard', async () => {
      // Wait a moment for the report to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if report appears in UI
      const page = await adminContext.newPage();
      await page.goto(`${config.webUrl}/dashboard`);
      
      // Navigate to reports page
      await page.click('text=Reports');
      
      // Wait for reports to load
      await page.waitForSelector('text=Counterfeit Reports');
      
      // Check if our report appears
      await page.waitForSelector('text=Integration test report');
      
      await page.close();
    });
  });
  
  // Error Handling Integration Tests
  describe('Error Handling Integration', () => {
    it('should handle invalid login credentials', async () => {
      const page = await browser.newPage();
      await page.goto(`${config.webUrl}/login`);
      
      // Fill login form with invalid credentials
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Check for error message
      await page.waitForSelector('text=Invalid credentials');
      
      await page.close();
    });
    
    it('should handle invalid token verification', async () => {
      const page = await consumerContext.newPage();
      await page.goto(`${config.webUrl}/scan`);
      
      // Switch to manual entry
      await page.click('text=Manual Entry');
      
      // Enter an invalid token
      await page.fill('input[placeholder*="token"]', 'INVALID-TOKEN-FORMAT');
      
      // Click verify
      await page.click('text=Verify Product');
      
      // Wait for verification result
      await page.waitForSelector('text=Counterfeit Product');
      
      await page.close();
    });
    
    it('should handle unauthorized access to admin features', async () => {
      // Try to access admin API endpoint with consumer token
      try {
        await axios.get(`${config.apiUrl}/analytics/verifications`, {
          headers: { Authorization: `Bearer ${consumerToken}` }
        });
        
        // Should not reach here
        expect.fail('Consumer should not be able to access admin analytics');
      } catch (error) {
        expect(error.response.status).to.equal(403);
      }
      
      // Try to access admin page with consumer account
      const page = await consumerContext.newPage();
      await page.goto(`${config.webUrl}/dashboard`);
      
      // Should be redirected to consumer homepage
      await page.waitForSelector('text=Scan Product');
      
      await page.close();
    });
  });
});