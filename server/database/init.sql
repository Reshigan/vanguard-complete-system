-- Vanguard Anti-Counterfeiting System - Database Initialization
-- This script creates the initial database schema and sample data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'manufacturer', 'distributor', 'retailer', 'consumer');
CREATE TYPE token_status AS ENUM ('active', 'used', 'expired', 'revoked');
CREATE TYPE validation_result AS ENUM ('authentic', 'counterfeit', 'suspicious');
CREATE TYPE report_status AS ENUM ('pending', 'confirmed', 'rejected', 'investigating');
CREATE TYPE channel_status AS ENUM ('active', 'flagged', 'suspended');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'consumer',
    company VARCHAR(255),
    phone VARCHAR(50),
    location JSONB,
    points INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    manufacturer UUID REFERENCES users(id),
    price DECIMAL(10,2),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Distribution channels table
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    manufacturer UUID REFERENCES users(id),
    distributor UUID REFERENCES users(id),
    retailer UUID REFERENCES users(id),
    risk_score INTEGER DEFAULT 0,
    status channel_status DEFAULT 'active',
    region VARCHAR(100),
    city VARCHAR(100),
    coordinates POINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Authentication tokens table
CREATE TABLE IF NOT EXISTS auth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(255) UNIQUE NOT NULL,
    product UUID REFERENCES products(id),
    channel UUID REFERENCES channels(id),
    status token_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Validations table
CREATE TABLE IF NOT EXISTS validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id),
    product UUID REFERENCES products(id),
    result validation_result NOT NULL,
    location JSONB,
    device_info JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    validation UUID REFERENCES validations(id),
    user_id UUID REFERENCES users(id),
    location JSONB,
    description TEXT,
    evidence_type VARCHAR(50),
    evidence_urls TEXT[],
    status report_status DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ML models table
CREATE TABLE IF NOT EXISTS ml_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    version BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    accuracy DECIMAL(5,4),
    last_trained TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anomaly results table
CREATE TABLE IF NOT EXISTS anomaly_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    validation UUID REFERENCES validations(id),
    user_id UUID REFERENCES users(id),
    product UUID REFERENCES products(id),
    score DECIMAL(5,4) NOT NULL,
    type VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON products(manufacturer);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_product ON auth_tokens(product);
CREATE INDEX IF NOT EXISTS idx_validations_token ON validations(token);
CREATE INDEX IF NOT EXISTS idx_validations_user ON validations(user_id);
CREATE INDEX IF NOT EXISTS idx_validations_created_at ON validations(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_results_user ON anomaly_results(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

-- Insert default admin user
INSERT INTO users (email, password, name, role, company, location, is_verified) 
VALUES (
    'admin@vanguard.local',
    '$2a$10$XQxBtEuPWj8wGEWdnrJ2XOzQVYZ3f/pKrYTzI.Ks7XzQR3YJQhwye', -- Admin@123456
    'System Administrator',
    'admin',
    'Vanguard Security Systems',
    '{"country": "United States", "city": "San Francisco", "coordinates": [37.7749, -122.4194]}',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample manufacturer
INSERT INTO users (email, password, name, role, company, location, is_verified) 
VALUES (
    'manufacturer@vanguard.local',
    '$2a$10$XQxBtEuPWj8wGEWdnrJ2XOzQVYZ3f/pKrYTzI.Ks7XzQR3YJQhwye', -- password123
    'John Manufacturing',
    'manufacturer',
    'Premium Electronics Inc.',
    '{"country": "United States", "city": "New York", "coordinates": [40.7128, -74.0060]}',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample consumer
INSERT INTO users (email, password, name, role, points, location, is_verified) 
VALUES (
    'consumer@vanguard.local',
    '$2a$10$XQxBtEuPWj8wGEWdnrJ2XOzQVYZ3f/pKrYTzI.Ks7XzQR3YJQhwye', -- password123
    'Jane Consumer',
    'consumer',
    250,
    '{"country": "United States", "city": "Los Angeles", "coordinates": [34.0522, -118.2437]}',
    true
) ON CONFLICT (email) DO NOTHING;