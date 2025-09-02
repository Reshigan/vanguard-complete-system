/**
 * Comprehensive UI Testing Suite for Vanguard Anti-Counterfeiting System
 * 
 * This test suite verifies all frontend functionality including:
 * - Authentication flows
 * - Business UI components
 * - Consumer UI components
 * - Responsive design
 * - User interactions
 * - Error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import ThemeProvider from '../components/ThemeProvider';
import App from '../App';
import Login from '../components/auth/Login';
import Dashboard from '../components/business/Dashboard';
import HomePage from '../components/consumer/HomePage';
import ScanPage from '../components/consumer/ScanPage';

// Mock API responses
jest.mock('../services/api', () => ({
  login: jest.fn((email, password) => {
    if (email === 'admin@example.com' && password === 'password') {
      return Promise.resolve({
        user: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin'
        },
        token: 'mock-admin-token'
      });
    } else if (email === 'user@example.com' && password === 'password') {
      return Promise.resolve({
        user: {
          id: 2,
          name: 'Consumer User',
          email: 'user@example.com',
          role: 'consumer',
          points: 1250
        },
        token: 'mock-consumer-token'
      });
    } else {
      return Promise.reject(new Error('Invalid credentials'));
    }
  }),
  getProfile: jest.fn(() => {
    return Promise.resolve({
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin'
    });
  }),
  getProducts: jest.fn(() => {
    return Promise.resolve([
      {
        id: 1,
        name: 'Premium Headphones',
        sku: 'SKU-1001',
        description: 'High-quality noise-cancelling headphones',
        category: 'Electronics',
        price: 199.99
      },
      {
        id: 2,
        name: 'Smart Watch',
        sku: 'SKU-1002',
        description: 'Fitness and health tracking smartwatch',
        category: 'Wearables',
        price: 249.99
      }
    ]);
  }),
  verifyToken: jest.fn((token) => {
    if (token === 'VALID-TOKEN-123') {
      return Promise.resolve({
        valid: true,
        product: {
          id: 1,
          name: 'Premium Headphones',
          manufacturer: 'AudioTech Inc.',
          serialNumber: 'SN12345678',
          manufactureDate: '2025-05-15'
        }
      });
    } else {
      return Promise.resolve({
        valid: false,
        error: 'Invalid token'
      });
    }
  })
}));

// Helper function to render with providers
const renderWithProviders = (ui, options = {}) => {
  return render(
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          {ui}
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>,
    options
  );
};

describe('Vanguard UI Tests', () => {
  // Authentication Tests
  describe('Authentication', () => {
    test('Login page renders correctly', () => {
      renderWithProviders(<Login />);
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    test('Login with valid admin credentials', async () => {
      renderWithProviders(<Login />);
      
      await userEvent.type(screen.getByLabelText(/Email Address/i), 'admin@example.com');
      await userEvent.type(screen.getByLabelText(/Password/i), 'password');
      
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      
      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
      });
    });

    test('Login with valid consumer credentials', async () => {
      renderWithProviders(<Login />);
      
      await userEvent.type(screen.getByLabelText(/Email Address/i), 'user@example.com');
      await userEvent.type(screen.getByLabelText(/Password/i), 'password');
      
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      
      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
      });
    });

    test('Login with invalid credentials shows error', async () => {
      renderWithProviders(<Login />);
      
      await userEvent.type(screen.getByLabelText(/Email Address/i), 'wrong@example.com');
      await userEvent.type(screen.getByLabelText(/Password/i), 'wrongpassword');
      
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  // Business UI Tests
  describe('Business UI', () => {
    test('Dashboard renders correctly for admin', () => {
      renderWithProviders(<Dashboard />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Recent Activities')).toBeInTheDocument();
      expect(screen.getByText('Top Products')).toBeInTheDocument();
      expect(screen.getByText('Distribution Channel Performance')).toBeInTheDocument();
    });

    test('Dashboard displays statistics', () => {
      renderWithProviders(<Dashboard />);
      
      expect(screen.getByText('Total Authentications')).toBeInTheDocument();
      expect(screen.getByText('Suspicious Activities')).toBeInTheDocument();
      expect(screen.getByText('Active Products')).toBeInTheDocument();
      expect(screen.getByText('Consumer Reports')).toBeInTheDocument();
    });

    test('Dashboard navigation works', () => {
      renderWithProviders(<Dashboard />);
      
      // Test sidebar navigation
      fireEvent.click(screen.getByText('Analytics'));
      fireEvent.click(screen.getByText('Products'));
      fireEvent.click(screen.getByText('Authentication'));
      fireEvent.click(screen.getByText('Reports'));
      fireEvent.click(screen.getByText('Settings'));
      
      // Test profile menu
      fireEvent.click(screen.getByLabelText('Account'));
      expect(screen.getByText('My Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  // Consumer UI Tests
  describe('Consumer UI', () => {
    test('Home page renders correctly for consumer', () => {
      renderWithProviders(<HomePage />);
      
      expect(screen.getByText('Scan Product')).toBeInTheDocument();
      expect(screen.getByText('My Rewards')).toBeInTheDocument();
      expect(screen.getByText('Report Fake')).toBeInTheDocument();
      expect(screen.getByText('Featured Rewards')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    test('Scan page renders correctly', () => {
      renderWithProviders(<ScanPage />);
      
      expect(screen.getByText('Verify Product Authenticity')).toBeInTheDocument();
      expect(screen.getByText('Camera')).toBeInTheDocument();
      expect(screen.getByText('Manual Entry')).toBeInTheDocument();
      expect(screen.getByText('Verify Product')).toBeInTheDocument();
    });

    test('Manual token verification works', async () => {
      renderWithProviders(<ScanPage />);
      
      // Switch to manual entry
      fireEvent.click(screen.getByText('Manual Entry'));
      
      // Enter a valid token
      await userEvent.type(screen.getByLabelText(/Authentication Token/i), 'VALID-TOKEN-123');
      
      // Click verify
      fireEvent.click(screen.getByText('Verify Product'));
      
      // Wait for verification result
      await waitFor(() => {
        expect(screen.getByText('Verification Result')).toBeInTheDocument();
      });
    });

    test('Navigation works in consumer UI', () => {
      renderWithProviders(<HomePage />);
      
      // Test bottom navigation (mobile)
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
      window.dispatchEvent(new Event('resize'));
      
      fireEvent.click(screen.getByText('Scan'));
      fireEvent.click(screen.getByText('Rewards'));
      fireEvent.click(screen.getByText('Profile'));
      fireEvent.click(screen.getByText('Home'));
      
      // Reset window size
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
      window.dispatchEvent(new Event('resize'));
    });
  });

  // Responsive Design Tests
  describe('Responsive Design', () => {
    test('Business UI adapts to mobile view', () => {
      renderWithProviders(<Dashboard />);
      
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
      window.dispatchEvent(new Event('resize'));
      
      // Check if drawer is closed by default on mobile
      expect(screen.getByLabelText('open drawer')).toBeInTheDocument();
      
      // Open drawer
      fireEvent.click(screen.getByLabelText('open drawer'));
      
      // Check if drawer is open
      expect(screen.getByText('Vanguard')).toBeInTheDocument();
      
      // Reset window size
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
      window.dispatchEvent(new Event('resize'));
    });

    test('Consumer UI adapts to mobile view', () => {
      renderWithProviders(<HomePage />);
      
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
      window.dispatchEvent(new Event('resize'));
      
      // Check if bottom navigation is visible
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Scan')).toBeInTheDocument();
      expect(screen.getByText('Rewards')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      
      // Reset window size
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
      window.dispatchEvent(new Event('resize'));
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    test('Shows error message for invalid token', async () => {
      renderWithProviders(<ScanPage />);
      
      // Switch to manual entry
      fireEvent.click(screen.getByText('Manual Entry'));
      
      // Enter an invalid token
      await userEvent.type(screen.getByLabelText(/Authentication Token/i), 'INVALID-TOKEN');
      
      // Click verify
      fireEvent.click(screen.getByText('Verify Product'));
      
      // Wait for verification result
      await waitFor(() => {
        expect(screen.getByText('Counterfeit Product')).toBeInTheDocument();
      });
    });

    test('Handles network errors gracefully', async () => {
      // Mock API to throw network error
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
      
      renderWithProviders(<Login />);
      
      await userEvent.type(screen.getByLabelText(/Email Address/i), 'admin@example.com');
      await userEvent.type(screen.getByLabelText(/Password/i), 'password');
      
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/An error occurred/i)).toBeInTheDocument();
      });
      
      // Restore fetch
      global.fetch.mockRestore();
    });
  });
});