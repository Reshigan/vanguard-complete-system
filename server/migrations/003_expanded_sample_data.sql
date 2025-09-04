-- Expanded Sample Data for Level 3 System
-- This creates 100,000+ records with realistic distribution

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE validations, transactions, rewards, notifications, user_achievements, leaderboard_entries RESTART IDENTITY CASCADE;

-- Generate more users (total 10,000)
INSERT INTO users (username, email, password_hash, role, total_points, level, created_at)
SELECT 
    'user_' || generate_series,
    'user' || generate_series || '@example.com',
    '$2b$10$YourHashedPasswordHere', -- In production, use proper hashed passwords
    CASE 
        WHEN random() < 0.7 THEN 'consumer'
        WHEN random() < 0.95 THEN 'manufacturer'
        ELSE 'admin'
    END,
    floor(random() * 10000),
    CASE 
        WHEN random() < 0.4 THEN 1
        WHEN random() < 0.7 THEN 2
        WHEN random() < 0.9 THEN 3
        WHEN random() < 0.97 THEN 4
        ELSE 5
    END,
    NOW() - (random() * INTERVAL '365 days')
FROM generate_series(1001, 10000);

-- Generate more manufacturers (total 500)
INSERT INTO manufacturers (name, description, website, verified, trust_score, created_at)
SELECT 
    'Manufacturer ' || generate_series,
    'Leading manufacturer of ' || 
    CASE floor(random() * 10)
        WHEN 0 THEN 'electronics'
        WHEN 1 THEN 'pharmaceuticals'
        WHEN 2 THEN 'luxury goods'
        WHEN 3 THEN 'automotive parts'
        WHEN 4 THEN 'cosmetics'
        WHEN 5 THEN 'fashion items'
        WHEN 6 THEN 'food products'
        WHEN 7 THEN 'beverages'
        WHEN 8 THEN 'sports equipment'
        ELSE 'consumer goods'
    END,
    'https://manufacturer' || generate_series || '.com',
    random() < 0.8,
    50 + floor(random() * 50),
    NOW() - (random() * INTERVAL '730 days')
FROM generate_series(101, 500);

-- Generate more products (total 50,000)
INSERT INTO products (name, description, manufacturer_id, category, sku, batch_number, manufacturing_date, expiry_date, created_at)
SELECT 
    'Product ' || p.product_num || ' - ' || 
    CASE p.category_num
        WHEN 0 THEN 'Electronics'
        WHEN 1 THEN 'Pharmaceuticals'
        WHEN 2 THEN 'Luxury'
        WHEN 3 THEN 'Automotive'
        WHEN 4 THEN 'Cosmetics'
        WHEN 5 THEN 'Fashion'
        WHEN 6 THEN 'Food'
        WHEN 7 THEN 'Beverages'
        WHEN 8 THEN 'Sports'
        ELSE 'Consumer'
    END,
    'High-quality ' || 
    CASE p.category_num
        WHEN 0 THEN 'electronic device'
        WHEN 1 THEN 'pharmaceutical product'
        WHEN 2 THEN 'luxury item'
        WHEN 3 THEN 'automotive part'
        WHEN 4 THEN 'cosmetic product'
        WHEN 5 THEN 'fashion accessory'
        WHEN 6 THEN 'food product'
        WHEN 7 THEN 'beverage'
        WHEN 8 THEN 'sports equipment'
        ELSE 'consumer product'
    END || ' with advanced features',
    1 + floor(random() * 500),
    CASE p.category_num
        WHEN 0 THEN 'Electronics'
        WHEN 1 THEN 'Pharmaceuticals'
        WHEN 2 THEN 'Luxury'
        WHEN 3 THEN 'Automotive'
        WHEN 4 THEN 'Cosmetics'
        WHEN 5 THEN 'Fashion'
        WHEN 6 THEN 'Food'
        WHEN 7 THEN 'Beverages'
        WHEN 8 THEN 'Sports'
        ELSE 'Consumer'
    END,
    'SKU-' || LPAD(p.product_num::text, 8, '0'),
    'BATCH-' || TO_CHAR(NOW() - (random() * INTERVAL '180 days'), 'YYYYMMDD') || '-' || LPAD(floor(random() * 1000)::text, 3, '0'),
    NOW() - (random() * INTERVAL '180 days'),
    CASE 
        WHEN p.category_num IN (1, 4, 6, 7) THEN NOW() + (random() * INTERVAL '730 days')
        ELSE NULL
    END,
    NOW() - (random() * INTERVAL '365 days')
FROM (
    SELECT 
        generate_series as product_num,
        floor(random() * 10) as category_num
    FROM generate_series(5001, 50000)
) p;

-- Generate QR codes for all products
INSERT INTO qr_codes (product_id, code, scan_count, created_at)
SELECT 
    id,
    'QR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(id::text, 8, '0'),
    floor(random() * 100),
    created_at
FROM products
WHERE id > 5000;

-- Generate locations data
INSERT INTO locations (latitude, longitude, address, city, state, country, postal_code)
SELECT 
    -90 + (random() * 180),  -- latitude
    -180 + (random() * 360), -- longitude
    floor(random() * 9999)::text || ' ' || 
    CASE floor(random() * 10)
        WHEN 0 THEN 'Main St'
        WHEN 1 THEN 'Oak Ave'
        WHEN 2 THEN 'Elm St'
        WHEN 3 THEN 'Market St'
        WHEN 4 THEN 'Park Ave'
        WHEN 5 THEN 'Broadway'
        WHEN 6 THEN 'First St'
        WHEN 7 THEN 'Second Ave'
        WHEN 8 THEN 'Third St'
        ELSE 'Fourth Ave'
    END,
    CASE floor(random() * 20)
        WHEN 0 THEN 'New York'
        WHEN 1 THEN 'Los Angeles'
        WHEN 2 THEN 'Chicago'
        WHEN 3 THEN 'Houston'
        WHEN 4 THEN 'Phoenix'
        WHEN 5 THEN 'Philadelphia'
        WHEN 6 THEN 'San Antonio'
        WHEN 7 THEN 'San Diego'
        WHEN 8 THEN 'Dallas'
        WHEN 9 THEN 'San Jose'
        WHEN 10 THEN 'London'
        WHEN 11 THEN 'Paris'
        WHEN 12 THEN 'Tokyo'
        WHEN 13 THEN 'Mumbai'
        WHEN 14 THEN 'Shanghai'
        WHEN 15 THEN 'Sydney'
        WHEN 16 THEN 'Toronto'
        WHEN 17 THEN 'Berlin'
        WHEN 18 THEN 'Madrid'
        ELSE 'Rome'
    END,
    CASE floor(random() * 10)
        WHEN 0 THEN 'NY'
        WHEN 1 THEN 'CA'
        WHEN 2 THEN 'IL'
        WHEN 3 THEN 'TX'
        WHEN 4 THEN 'AZ'
        WHEN 5 THEN 'PA'
        WHEN 6 THEN 'TX'
        WHEN 7 THEN 'CA'
        WHEN 8 THEN 'TX'
        ELSE 'CA'
    END,
    CASE floor(random() * 10)
        WHEN 0 THEN 'USA'
        WHEN 1 THEN 'USA'
        WHEN 2 THEN 'USA'
        WHEN 3 THEN 'USA'
        WHEN 4 THEN 'UK'
        WHEN 5 THEN 'France'
        WHEN 6 THEN 'Japan'
        WHEN 7 THEN 'India'
        WHEN 8 THEN 'China'
        ELSE 'Australia'
    END,
    LPAD(floor(random() * 99999)::text, 5, '0')
FROM generate_series(1, 1000);

-- Generate massive validation data (500,000 validations)
INSERT INTO validations (user_id, product_id, qr_code_id, location_id, is_authentic, confidence_score, ml_model_version, risk_factors, points_earned, created_at)
SELECT 
    1 + floor(random() * 10000), -- user_id
    1 + floor(random() * 50000), -- product_id
    1 + floor(random() * 50000), -- qr_code_id
    1 + floor(random() * 1000),  -- location_id
    random() < 0.95,             -- 95% authentic rate
    CASE 
        WHEN random() < 0.95 THEN 0.8 + (random() * 0.2)  -- High confidence for authentic
        ELSE 0.2 + (random() * 0.3)                       -- Low confidence for counterfeit
    END,
    '3.0.' || floor(random() * 10),
    CASE 
        WHEN random() < 0.95 THEN '[]'::jsonb
        ELSE jsonb_build_array(
            CASE floor(random() * 5)
                WHEN 0 THEN 'price_anomaly'
                WHEN 1 THEN 'location_mismatch'
                WHEN 2 THEN 'pattern_deviation'
                WHEN 3 THEN 'supplier_risk'
                ELSE 'behavioral_anomaly'
            END
        )
    END,
    CASE 
        WHEN random() < 0.95 THEN floor(random() * 50) + 10
        ELSE floor(random() * 100) + 50
    END,
    NOW() - (random() * INTERVAL '365 days')
FROM generate_series(1, 500000);

-- Generate transactions
INSERT INTO transactions (user_id, type, amount, status, reference_id, metadata, created_at)
SELECT 
    1 + floor(random() * 10000),
    CASE floor(random() * 5)
        WHEN 0 THEN 'subscription'
        WHEN 1 THEN 'validation_fee'
        WHEN 2 THEN 'reward_redemption'
        WHEN 3 THEN 'premium_feature'
        ELSE 'api_usage'
    END,
    CASE floor(random() * 5)
        WHEN 0 THEN 9.99
        WHEN 1 THEN 29.99
        WHEN 2 THEN 99.99
        WHEN 3 THEN 199.99
        ELSE 499.99
    END,
    CASE 
        WHEN random() < 0.95 THEN 'completed'
        WHEN random() < 0.98 THEN 'pending'
        ELSE 'failed'
    END,
    'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(generate_series::text, 8, '0'),
    jsonb_build_object(
        'payment_method', CASE floor(random() * 4)
            WHEN 0 THEN 'credit_card'
            WHEN 1 THEN 'debit_card'
            WHEN 2 THEN 'paypal'
            ELSE 'crypto'
        END,
        'currency', 'USD'
    ),
    NOW() - (random() * INTERVAL '365 days')
FROM generate_series(1, 50000);

-- Generate rewards
INSERT INTO rewards (user_id, type, points, description, expires_at, redeemed, created_at)
SELECT 
    1 + floor(random() * 10000),
    CASE floor(random() * 6)
        WHEN 0 THEN 'validation_bonus'
        WHEN 1 THEN 'streak_bonus'
        WHEN 2 THEN 'referral_bonus'
        WHEN 3 THEN 'achievement_unlock'
        WHEN 4 THEN 'special_event'
        ELSE 'daily_bonus'
    END,
    CASE floor(random() * 6)
        WHEN 0 THEN 10
        WHEN 1 THEN 25
        WHEN 2 THEN 50
        WHEN 3 THEN 100
        WHEN 4 THEN 250
        ELSE 500
    END,
    CASE floor(random() * 6)
        WHEN 0 THEN 'Validation bonus reward'
        WHEN 1 THEN 'Streak bonus for consecutive days'
        WHEN 2 THEN 'Referral bonus for inviting friends'
        WHEN 3 THEN 'Achievement unlocked'
        WHEN 4 THEN 'Special event reward'
        ELSE 'Daily login bonus'
    END,
    NOW() + (random() * INTERVAL '90 days'),
    random() < 0.3,
    NOW() - (random() * INTERVAL '180 days')
FROM generate_series(1, 100000);

-- Generate notifications
INSERT INTO notifications (user_id, type, title, message, read, data, created_at)
SELECT 
    1 + floor(random() * 10000),
    CASE floor(random() * 8)
        WHEN 0 THEN 'validation_complete'
        WHEN 1 THEN 'counterfeit_alert'
        WHEN 2 THEN 'reward_earned'
        WHEN 3 THEN 'achievement_unlocked'
        WHEN 4 THEN 'system_update'
        WHEN 5 THEN 'promotion'
        WHEN 6 THEN 'security_alert'
        ELSE 'general'
    END,
    CASE floor(random() * 8)
        WHEN 0 THEN 'Validation Complete'
        WHEN 1 THEN 'Counterfeit Detected!'
        WHEN 2 THEN 'Reward Earned!'
        WHEN 3 THEN 'Achievement Unlocked!'
        WHEN 4 THEN 'System Update'
        WHEN 5 THEN 'Special Promotion'
        WHEN 6 THEN 'Security Alert'
        ELSE 'Important Notice'
    END,
    CASE floor(random() * 8)
        WHEN 0 THEN 'Your product validation is complete'
        WHEN 1 THEN 'A counterfeit product has been detected in your area'
        WHEN 2 THEN 'You have earned bonus points!'
        WHEN 3 THEN 'Congratulations on your achievement!'
        WHEN 4 THEN 'New features are now available'
        WHEN 5 THEN 'Limited time offer available'
        WHEN 6 THEN 'Unusual activity detected'
        ELSE 'You have a new message'
    END,
    random() < 0.7,
    jsonb_build_object(
        'priority', CASE 
            WHEN random() < 0.1 THEN 'high'
            WHEN random() < 0.3 THEN 'medium'
            ELSE 'low'
        END
    ),
    NOW() - (random() * INTERVAL '90 days')
FROM generate_series(1, 200000);

-- Generate blockchain transactions
INSERT INTO blockchain_transactions (transaction_hash, block_number, contract_address, method, gas_used, gas_price, status, data, created_at)
SELECT 
    '0x' || md5(random()::text || generate_series::text),
    1000000 + generate_series,
    '0x' || substring(md5(random()::text), 1, 40),
    CASE floor(random() * 5)
        WHEN 0 THEN 'registerProduct'
        WHEN 1 THEN 'validateProduct'
        WHEN 2 THEN 'reportCounterfeit'
        WHEN 3 THEN 'transferOwnership'
        ELSE 'updateMetadata'
    END,
    20000 + floor(random() * 80000),
    10 + floor(random() * 90),
    CASE 
        WHEN random() < 0.98 THEN 'success'
        ELSE 'failed'
    END,
    jsonb_build_object(
        'network', CASE floor(random() * 3)
            WHEN 0 THEN 'ethereum'
            WHEN 1 THEN 'polygon'
            ELSE 'bsc'
        END
    ),
    NOW() - (random() * INTERVAL '365 days')
FROM generate_series(1, 100000);

-- Generate achievements
INSERT INTO achievements (name, description, icon, points, requirement_type, requirement_value, tier)
VALUES 
    ('First Scan', 'Complete your first product validation', 'qr_code', 10, 'validations', 1, 'bronze'),
    ('Scanner Novice', 'Complete 10 product validations', 'qr_code_scanner', 25, 'validations', 10, 'bronze'),
    ('Scanner Expert', 'Complete 100 product validations', 'verified', 100, 'validations', 100, 'silver'),
    ('Scanner Master', 'Complete 1000 product validations', 'workspace_premium', 500, 'validations', 1000, 'gold'),
    ('Scanner Legend', 'Complete 10000 product validations', 'military_tech', 2000, 'validations', 10000, 'platinum'),
    ('Counterfeit Hunter', 'Detect your first counterfeit', 'security', 50, 'counterfeits', 1, 'bronze'),
    ('Counterfeit Detective', 'Detect 10 counterfeits', 'policy', 200, 'counterfeits', 10, 'silver'),
    ('Counterfeit Expert', 'Detect 50 counterfeits', 'shield', 1000, 'counterfeits', 50, 'gold'),
    ('Daily Warrior', 'Validate products 7 days in a row', 'today', 100, 'streak', 7, 'silver'),
    ('Monthly Champion', 'Validate products 30 days in a row', 'date_range', 500, 'streak', 30, 'gold'),
    ('Social Butterfly', 'Refer 5 friends', 'people', 250, 'referrals', 5, 'silver'),
    ('Community Leader', 'Refer 20 friends', 'groups', 1000, 'referrals', 20, 'gold'),
    ('Early Bird', 'Complete validations before 8 AM', 'alarm', 50, 'special', 1, 'bronze'),
    ('Night Owl', 'Complete validations after 10 PM', 'nightlight', 50, 'special', 1, 'bronze'),
    ('Globe Trotter', 'Validate products in 5 different cities', 'public', 200, 'locations', 5, 'silver'),
    ('World Explorer', 'Validate products in 10 different countries', 'language', 1000, 'locations', 10, 'gold');

-- Generate user achievements
INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked, unlocked_at)
SELECT 
    u.user_id,
    a.id,
    CASE 
        WHEN random() < 0.3 THEN a.requirement_value
        ELSE floor(random() * a.requirement_value)
    END,
    random() < 0.3,
    CASE 
        WHEN random() < 0.3 THEN NOW() - (random() * INTERVAL '180 days')
        ELSE NULL
    END
FROM (SELECT DISTINCT 1 + floor(random() * 10000) as user_id FROM generate_series(1, 5000)) u
CROSS JOIN achievements a
WHERE random() < 0.5;

-- Generate leaderboard entries
INSERT INTO leaderboard_entries (user_id, period, score, rank, category, created_at)
SELECT 
    user_id,
    period,
    score,
    ROW_NUMBER() OVER (PARTITION BY period, category ORDER BY score DESC),
    category,
    NOW()
FROM (
    SELECT 
        1 + floor(random() * 10000) as user_id,
        CASE floor(random() * 4)
            WHEN 0 THEN 'daily'
            WHEN 1 THEN 'weekly'
            WHEN 2 THEN 'monthly'
            ELSE 'all_time'
        END as period,
        floor(random() * 10000) as score,
        CASE floor(random() * 4)
            WHEN 0 THEN 'validations'
            WHEN 1 THEN 'counterfeits'
            WHEN 2 THEN 'points'
            ELSE 'streak'
        END as category
    FROM generate_series(1, 10000)
) scores;

-- Generate API logs for analytics
INSERT INTO api_logs (endpoint, method, status_code, response_time, user_id, ip_address, user_agent, created_at)
SELECT 
    CASE floor(random() * 10)
        WHEN 0 THEN '/api/validate'
        WHEN 1 THEN '/api/products'
        WHEN 2 THEN '/api/users/profile'
        WHEN 3 THEN '/api/rewards'
        WHEN 4 THEN '/api/leaderboard'
        WHEN 5 THEN '/api/analytics'
        WHEN 6 THEN '/api/notifications'
        WHEN 7 THEN '/api/achievements'
        WHEN 8 THEN '/api/auth/login'
        ELSE '/api/health'
    END,
    CASE floor(random() * 4)
        WHEN 0 THEN 'GET'
        WHEN 1 THEN 'POST'
        WHEN 2 THEN 'PUT'
        ELSE 'DELETE'
    END,
    CASE 
        WHEN random() < 0.95 THEN 200
        WHEN random() < 0.98 THEN 400
        WHEN random() < 0.99 THEN 401
        ELSE 500
    END,
    CASE 
        WHEN random() < 0.8 THEN floor(random() * 100)
        WHEN random() < 0.95 THEN 100 + floor(random() * 400)
        ELSE 500 + floor(random() * 1500)
    END,
    CASE 
        WHEN random() < 0.8 THEN 1 + floor(random() * 10000)
        ELSE NULL
    END,
    '192.168.' || floor(random() * 255) || '.' || floor(random() * 255),
    CASE floor(random() * 5)
        WHEN 0 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        WHEN 1 THEN 'Mozilla/5.0 (Android 11; Mobile; rv:89.0)'
        WHEN 2 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        WHEN 3 THEN 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        ELSE 'VerifiAI-Mobile/3.0.0'
    END,
    NOW() - (random() * INTERVAL '30 days')
FROM generate_series(1, 1000000);

-- Generate ML predictions for analytics
INSERT INTO ml_predictions (model_name, input_data, predicted_result, actual_result, confidence_score, inference_time, created_at)
SELECT 
    CASE floor(random() * 8)
        WHEN 0 THEN 'counterfeit_detection'
        WHEN 1 THEN 'computer_vision'
        WHEN 2 THEN 'nlp_analysis'
        WHEN 3 THEN 'behavioral_analysis'
        WHEN 4 THEN 'supply_chain_risk'
        WHEN 5 THEN 'predictive_analytics'
        WHEN 6 THEN 'anomaly_detection'
        ELSE 'ensemble'
    END,
    jsonb_build_object(
        'features', array[random(), random(), random(), random(), random()]
    ),
    CASE WHEN random() < 0.95 THEN 'authentic' ELSE 'counterfeit' END,
    CASE WHEN random() < 0.95 THEN 'authentic' ELSE 'counterfeit' END,
    0.5 + (random() * 0.5),
    10 + floor(random() * 90),
    NOW() - (random() * INTERVAL '30 days')
FROM generate_series(1, 500000);

-- Generate system metrics
INSERT INTO system_metrics (cpu_usage, memory_usage, disk_usage, network_io, active_connections, created_at)
SELECT 
    20 + (random() * 60),  -- CPU 20-80%
    30 + (random() * 50),  -- Memory 30-80%
    40 + (random() * 40),  -- Disk 40-80%
    random() * 100,        -- Network I/O 0-100 MB/s
    floor(random() * 1000), -- Active connections
    NOW() - (interval '1 hour' * generate_series)
FROM generate_series(0, 720); -- Last 30 days of hourly data

-- Update user statistics
UPDATE users u
SET 
    total_points = COALESCE((
        SELECT SUM(points_earned) 
        FROM validations v 
        WHERE v.user_id = u.id
    ), 0) + COALESCE((
        SELECT SUM(points) 
        FROM rewards r 
        WHERE r.user_id = u.id AND r.redeemed = true
    ), 0),
    level = CASE 
        WHEN total_points < 100 THEN 1
        WHEN total_points < 500 THEN 2
        WHEN total_points < 2000 THEN 3
        WHEN total_points < 10000 THEN 4
        ELSE 5
    END;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_validations_created_at ON validations(created_at);
CREATE INDEX IF NOT EXISTS idx_validations_user_product ON validations(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint_created ON api_logs(endpoint, created_at);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_model_created ON ml_predictions(model_name, created_at);

-- Create materialized views for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_analytics AS
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as total_validations,
    COUNT(CASE WHEN is_authentic = false THEN 1 END) as counterfeits_detected,
    AVG(confidence_score) as avg_confidence,
    SUM(points_earned) as total_points_distributed
FROM validations
GROUP BY DATE(created_at);

CREATE MATERIALIZED VIEW IF NOT EXISTS user_analytics AS
SELECT 
    u.id as user_id,
    u.username,
    u.role,
    u.level,
    COUNT(DISTINCT v.id) as total_validations,
    COUNT(DISTINCT CASE WHEN v.is_authentic = false THEN v.id END) as counterfeits_found,
    COUNT(DISTINCT v.product_id) as unique_products_scanned,
    COUNT(DISTINCT DATE(v.created_at)) as active_days,
    MAX(v.created_at) as last_validation,
    AVG(v.confidence_score) as avg_confidence
FROM users u
LEFT JOIN validations v ON v.user_id = u.id
GROUP BY u.id, u.username, u.role, u.level;

-- Refresh materialized views
REFRESH MATERIALIZED VIEW daily_analytics;
REFRESH MATERIALIZED VIEW user_analytics;

-- Summary statistics
SELECT 'Data Generation Complete!' as status;
SELECT 'Users' as entity, COUNT(*) as count FROM users
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Validations', COUNT(*) FROM validations
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'Rewards', COUNT(*) FROM rewards
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'API Logs', COUNT(*) FROM api_logs
UNION ALL
SELECT 'ML Predictions', COUNT(*) FROM ml_predictions;