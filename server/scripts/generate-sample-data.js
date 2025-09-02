/**
 * Vanguard Anti-Counterfeiting System - Sample Data Generator
 * 
 * This script generates sample data for demonstration purposes
 */

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

// Set faker seed for reproducible data
faker.seed(42);

// Database connection
const connectDB = async () => {
  try {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://vanguard:vanguard123@localhost:5432/vanguard';
    console.log('Connecting to database...');
    
    // For this simple script, we'll use a basic approach
    // In a real implementation, you'd use proper models
    
    console.log('Sample data generation completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Simple data generation without complex dependencies
const generateSampleData = async () => {
  console.log('Generating sample data...');
  
  // Create sample users
  const users = [
    {
      email: 'admin@vanguard.local',
      password: await bcrypt.hash('Admin@123456', 10),
      name: 'System Administrator',
      role: 'admin',
      company: 'Vanguard Security Systems',
      is_verified: true
    },
    {
      email: 'manufacturer@vanguard.local',
      password: await bcrypt.hash('password123', 10),
      name: 'John Manufacturing',
      role: 'manufacturer',
      company: 'Premium Electronics Inc.',
      is_verified: true
    },
    {
      email: 'consumer@vanguard.local',
      password: await bcrypt.hash('password123', 10),
      name: 'Jane Consumer',
      role: 'consumer',
      points: 250,
      is_verified: true
    }
  ];
  
  // Create sample products
  const products = [
    {
      name: 'Premium Smartphone X1',
      sku: 'PSX1-2024-001',
      description: 'High-end smartphone with advanced security features',
      category: 'Electronics',
      price: 899.99
    },
    {
      name: 'Luxury Watch Series Pro',
      sku: 'LWP-2024-002',
      description: 'Premium luxury watch with authentication technology',
      category: 'Watches',
      price: 2499.99
    },
    {
      name: 'Designer Handbag Elite',
      sku: 'DHE-2024-003',
      description: 'Exclusive designer handbag with anti-counterfeit features',
      category: 'Fashion',
      price: 1299.99
    }
  ];
  
  console.log(`Generated ${users.length} sample users`);
  console.log(`Generated ${products.length} sample products`);
  
  return { users, products };
};

// Main execution
const main = async () => {
  try {
    await generateSampleData();
    console.log('Sample data generation completed successfully');
  } catch (error) {
    console.error('Error generating sample data:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateSampleData };