-- Seed data for Verifi AI

-- Insert admin user (password: admin123)
INSERT INTO users (id, email, password_hash, role, first_name, last_name, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@verifi.ai',
    '$2a$10$xVqYLGUuR1mPld5vVn3ZAuQGHlkHI3Pn2T8mCm9d/vwlC7Wl5Jrhy',
    'admin',
    'System',
    'Administrator',
    NOW()
);

-- Insert manufacturer users
INSERT INTO users (id, email, password_hash, role, first_name, last_name, created_at)
VALUES 
    ('00000000-0000-0000-0000-000000000002', 'johnnie@walker.com', '$2a$10$xVqYLGUuR1mPld5vVn3ZAuQGHlkHI3Pn2T8mCm9d/vwlC7Wl5Jrhy', 'manufacturer', 'Johnnie', 'Walker', NOW()),
    ('00000000-0000-0000-0000-000000000003', 'jack@daniels.com', '$2a$10$xVqYLGUuR1mPld5vVn3ZAuQGHlkHI3Pn2T8mCm9d/vwlC7Wl5Jrhy', 'manufacturer', 'Jack', 'Daniels', NOW()),
    ('00000000-0000-0000-0000-000000000004', 'jim@beam.com', '$2a$10$xVqYLGUuR1mPld5vVn3ZAuQGHlkHI3Pn2T8mCm9d/vwlC7Wl5Jrhy', 'manufacturer', 'Jim', 'Beam', NOW()),
    ('00000000-0000-0000-0000-000000000005', 'contact@hennessy.com', '$2a$10$xVqYLGUuR1mPld5vVn3ZAuQGHlkHI3Pn2T8mCm9d/vwlC7Wl5Jrhy', 'manufacturer', 'Hennessy', 'Cognac', NOW()),
    ('00000000-0000-0000-0000-000000000006', 'contact@greygoose.com', '$2a$10$xVqYLGUuR1mPld5vVn3ZAuQGHlkHI3Pn2T8mCm9d/vwlC7Wl5Jrhy', 'manufacturer', 'Grey', 'Goose', NOW());

-- Insert distributor users
INSERT INTO users (id, email, password_hash, role, first_name, last_name, created_at)
VALUES 
    ('00000000-0000-0000-0000-000000000007', 'contact@southernglazers.com', '$2a$10$xVqYLGUuR1mPld5vVn3ZAuQGHlkHI3Pn2T8mCm9d/vwlC7Wl5Jrhy', 'distributor', 'Southern', 'Glazers', NOW()),
    ('00000000-0000-0000-0000-000000000008', 'contact@republicnational.com', '$2a$10$xVqYLGUuR1mPld5vVn3ZAuQGHlkHI3Pn2T8mCm9d/vwlC7Wl5Jrhy', 'distributor', 'Republic', 'National', NOW());

-- Insert retailer users
INSERT INTO users (id, email, password_hash, role, first_name, last_name, created_at)
VALUES 
    ('00000000-0000-0000-0000-000000000009', 'contact@totalwine.com', '$2a$10$xVqYLGUuR1mPld5vVn3ZAuQGHlkHI3Pn2T8mCm9d/vwlC7Wl5Jrhy', 'retailer', 'Total', 'Wine', NOW()),
    ('00000000-0000-0000-0000-000000000010', 'contact@bevmo.com', '$2a$10$xVqYLGUuR1mPld5vVn3ZAuQGHlkHI3Pn2T8mCm9d/vwlC7Wl5Jrhy', 'retailer', 'BevMo', 'Stores', NOW());

-- Insert consumer users
INSERT INTO users (id, email, password_hash, role, first_name, last_name, created_at)
VALUES 
    ('00000000-0000-0000-0000-000000000011', 'john.smith@example.com', '$2a$10$xVqYLGUuR1mPld5vVn3ZAuQGHlkHI3Pn2T8mCm9d/vwlC7Wl5Jrhy', 'consumer', 'John', 'Smith', NOW()),
    ('00000000-0000-0000-0000-000000000012', 'jane.doe@example.com', '$2a$10$xVqYLGUuR1mPld5vVn3ZAuQGHlkHI3Pn2T8mCm9d/vwlC7Wl5Jrhy', 'consumer', 'Jane', 'Doe', NOW()),
    ('00000000-0000-0000-0000-000000000013', 'bob.johnson@example.com', '$2a$10$xVqYLGUuR1mPld5vVn3ZAuQGHlkHI3Pn2T8mCm9d/vwlC7Wl5Jrhy', 'consumer', 'Bob', 'Johnson', NOW()),
    ('00000000-0000-0000-0000-000000000014', 'alice.williams@example.com', '$2a$10$xVqYLGUuR1mPld5vVn3ZAuQGHlkHI3Pn2T8mCm9d/vwlC7Wl5Jrhy', 'consumer', 'Alice', 'Williams', NOW()),
    ('00000000-0000-0000-0000-000000000015', 'charlie.brown@example.com', '$2a$10$xVqYLGUuR1mPld5vVn3ZAuQGHlkHI3Pn2T8mCm9d/vwlC7Wl5Jrhy', 'consumer', 'Charlie', 'Brown', NOW());

-- Insert manufacturers
INSERT INTO manufacturers (id, user_id, company_name, website, logo_url, description, country, verification_status)
VALUES 
    ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000002', 'Johnnie Walker', 'https://www.johnniewalker.com', '/images/manufacturers/johnnie-walker.png', 'Johnnie Walker is a brand of Scotch whisky now owned by Diageo that originated in the Scottish town of Kilmarnock, East Ayrshire.', 'Scotland', 'verified'),
    ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000003', 'Jack Daniel''s', 'https://www.jackdaniels.com', '/images/manufacturers/jack-daniels.png', 'Jack Daniel''s is a brand of Tennessee whiskey and the top-selling American whiskey in the world.', 'USA', 'verified'),
    ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000004', 'Jim Beam', 'https://www.jimbeam.com', '/images/manufacturers/jim-beam.png', 'Jim Beam is a brand of bourbon whiskey produced in Clermont, Kentucky, by Beam Suntory.', 'USA', 'verified'),
    ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000005', 'Hennessy', 'https://www.hennessy.com', '/images/manufacturers/hennessy.png', 'Hennessy is a cognac house with headquarters in Cognac, France.', 'France', 'verified'),
    ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000006', 'Grey Goose', 'https://www.greygoose.com', '/images/manufacturers/grey-goose.png', 'Grey Goose is a brand of vodka produced in France.', 'France', 'verified');

-- Insert product categories
INSERT INTO product_categories (id, name, description)
VALUES 
    ('00000000-0000-0000-0000-000000000201', 'Whisky', 'Distilled alcoholic beverage made from fermented grain mash'),
    ('00000000-0000-0000-0000-000000000202', 'Bourbon', 'American whiskey, primarily made from corn'),
    ('00000000-0000-0000-0000-000000000203', 'Scotch', 'Whisky made in Scotland'),
    ('00000000-0000-0000-0000-000000000204', 'Cognac', 'Variety of brandy named after the town of Cognac, France'),
    ('00000000-0000-0000-0000-000000000205', 'Vodka', 'Distilled beverage composed primarily of water and ethanol');

-- Insert products
INSERT INTO products (id, manufacturer_id, category_id, name, description, sku, image_url, is_alcoholic, alcohol_content, volume_ml, country_of_origin, batch_number, production_date)
VALUES 
    ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203', 'Johnnie Walker Blue Label', 'Johnnie Walker Blue Label is an unrivaled masterpiece – an exquisite combination of Scotland's rarest and most exceptional whiskies.', 'JW-BL-750', '/images/products/johnnie-walker-blue.png', TRUE, 40.0, 750, 'Scotland', 'JW-2023-001', '2023-01-15'),
    ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203', 'Johnnie Walker Black Label', 'Johnnie Walker Black Label is a true icon, recognized as the benchmark for all other deluxe blends.', 'JW-BK-750', '/images/products/johnnie-walker-black.png', TRUE, 40.0, 750, 'Scotland', 'JW-2023-002', '2023-02-20'),
    ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000202', 'Jack Daniel''s Old No. 7', 'Mellowed drop by drop through 10-feet of sugar maple charcoal, then matured in handcrafted barrels.', 'JD-07-750', '/images/products/jack-daniels-7.png', TRUE, 40.0, 750, 'USA', 'JD-2023-001', '2023-03-10'),
    ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000202', 'Jack Daniel''s Single Barrel', 'Bottled from a single barrel from the Jack Daniel distillery.', 'JD-SB-750', '/images/products/jack-daniels-single.png', TRUE, 45.0, 750, 'USA', 'JD-2023-002', '2023-04-05'),
    ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000202', 'Jim Beam Original', 'The world's #1 Kentucky bourbon has been making history since 1795.', 'JB-OR-750', '/images/products/jim-beam-original.png', TRUE, 40.0, 750, 'USA', 'JB-2023-001', '2023-01-25'),
    ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000204', 'Hennessy XO', 'The original "extra old" cognac, first bottled in 1870 by Maurice Hennessy for family and friends.', 'HN-XO-750', '/images/products/hennessy-xo.png', TRUE, 40.0, 750, 'France', 'HN-2023-001', '2023-02-15'),
    ('00000000-0000-0000-0000-000000000307', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000204', 'Hennessy VSOP', 'Hennessy V.S.O.P Privilège is a balanced cognac, expressing 200 years of Hennessy's know-how.', 'HN-VSOP-750', '/images/products/hennessy-vsop.png', TRUE, 40.0, 750, 'France', 'HN-2023-002', '2023-03-20'),
    ('00000000-0000-0000-0000-000000000308', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000205', 'Grey Goose Original', 'Grey Goose vodka is distilled from French wheat and made with spring water from Gensac-la-Pallue.', 'GG-OR-750', '/images/products/grey-goose-original.png', TRUE, 40.0, 750, 'France', 'GG-2023-001', '2023-01-10'),
    ('00000000-0000-0000-0000-000000000309', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000205', 'Grey Goose La Poire', 'Grey Goose La Poire is a premium flavored vodka made with natural Anjou pear flavors.', 'GG-LP-750', '/images/products/grey-goose-poire.png', TRUE, 40.0, 750, 'France', 'GG-2023-002', '2023-02-05');

-- Insert tokens
INSERT INTO tokens (id, product_id, token_hash, nfc_id, status, batch_id, serial_number)
VALUES 
    ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000301', 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6', 'NFC-JW-BL-001', 'active', 'JW-2023-001', 'SN-00001'),
    ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000301', 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1', 'NFC-JW-BL-002', 'active', 'JW-2023-001', 'SN-00002'),
    ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000302', 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2', 'NFC-JW-BK-001', 'active', 'JW-2023-002', 'SN-00003'),
    ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000302', 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3', 'NFC-JW-BK-002', 'validated', 'JW-2023-002', 'SN-00004'),
    ('00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000303', 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4', 'NFC-JD-07-001', 'active', 'JD-2023-001', 'SN-00005'),
    ('00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000304', 'f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5', 'NFC-JD-SB-001', 'active', 'JD-2023-002', 'SN-00006'),
    ('00000000-0000-0000-0000-000000000407', '00000000-0000-0000-0000-000000000305', 'g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6', 'NFC-JB-OR-001', 'active', 'JB-2023-001', 'SN-00007'),
    ('00000000-0000-0000-0000-000000000408', '00000000-0000-0000-0000-000000000306', 'h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7', 'NFC-HN-XO-001', 'active', 'HN-2023-001', 'SN-00008'),
    ('00000000-0000-0000-0000-000000000409', '00000000-0000-0000-0000-000000000307', 'i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8', 'NFC-HN-VSOP-001', 'active', 'HN-2023-002', 'SN-00009'),
    ('00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000308', 'j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9', 'NFC-GG-OR-001', 'active', 'GG-2023-001', 'SN-00010'),
    ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000309', 'k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9j0', 'NFC-GG-LP-001', 'reported', 'GG-2023-002', 'SN-00011');

-- Insert token validations
INSERT INTO token_validations (id, token_id, user_id, validation_time, location_latitude, location_longitude, is_authentic, validation_method)
VALUES 
    ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000011', '2023-08-15 14:30:00', 40.7128, -74.0060, TRUE, 'nfc'),
    ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000012', '2023-08-20 16:45:00', 34.0522, -118.2437, FALSE, 'nfc');

-- Insert counterfeit reports
INSERT INTO counterfeit_reports (id, token_id, reporter_id, report_time, location_latitude, location_longitude, store_name, description, status)
VALUES 
    ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000012', '2023-08-20 16:50:00', 34.0522, -118.2437, 'Downtown Liquor Store', 'Purchased a bottle of Grey Goose La Poire but the NFC tag showed it was already validated. Suspicious packaging quality.', 'investigating');

-- Insert rewards for consumers
INSERT INTO rewards (id, user_id, points, level, lifetime_points)
VALUES 
    ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000011', 150, 2, 150),
    ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000012', 350, 3, 350),
    ('00000000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000013', 75, 1, 75),
    ('00000000-0000-0000-0000-000000000704', '00000000-0000-0000-0000-000000000014', 200, 2, 200),
    ('00000000-0000-0000-0000-000000000705', '00000000-0000-0000-0000-000000000015', 50, 1, 50);

-- Insert reward transactions
INSERT INTO reward_transactions (id, user_id, points, transaction_type, description, reference_id, reference_type)
VALUES 
    ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000011', 50, 'earn', 'Verified authentic product', '00000000-0000-0000-0000-000000000501', 'validation'),
    ('00000000-0000-0000-0000-000000000802', '00000000-0000-0000-0000-000000000011', 100, 'earn', 'First 5 verifications bonus', NULL, 'achievement'),
    ('00000000-0000-0000-0000-000000000803', '00000000-0000-0000-0000-000000000012', 50, 'earn', 'Attempted verification', '00000000-0000-0000-0000-000000000502', 'validation'),
    ('00000000-0000-0000-0000-000000000804', '00000000-0000-0000-0000-000000000012', 300, 'earn', 'Reported counterfeit product', '00000000-0000-0000-0000-000000000601', 'report'),
    ('00000000-0000-0000-0000-000000000805', '00000000-0000-0000-0000-000000000013', 75, 'earn', 'Account registration bonus', NULL, 'registration'),
    ('00000000-0000-0000-0000-000000000806', '00000000-0000-0000-0000-000000000014', 200, 'earn', 'Completed responsible drinking quiz', NULL, 'education'),
    ('00000000-0000-0000-0000-000000000807', '00000000-0000-0000-0000-000000000015', 50, 'earn', 'Profile completion bonus', NULL, 'profile');

-- Insert badges
INSERT INTO badges (id, name, description, image_url, points_value)
VALUES 
    ('00000000-0000-0000-0000-000000000901', 'Verification Novice', 'Verified your first authentic product', '/images/badges/verification-novice.png', 50),
    ('00000000-0000-0000-0000-000000000902', 'Verification Pro', 'Verified 10 authentic products', '/images/badges/verification-pro.png', 100),
    ('00000000-0000-0000-0000-000000000903', 'Counterfeit Hunter', 'Reported a counterfeit product', '/images/badges/counterfeit-hunter.png', 200),
    ('00000000-0000-0000-0000-000000000904', 'Responsible Consumer', 'Completed all responsible drinking resources', '/images/badges/responsible-consumer.png', 150),
    ('00000000-0000-0000-0000-000000000905', 'Brand Ambassador', 'Shared 5 verifications on social media', '/images/badges/brand-ambassador.png', 100);

-- Insert user badges
INSERT INTO user_badges (id, user_id, badge_id)
VALUES 
    ('00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000901'),
    ('00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000901'),
    ('00000000-0000-0000-0000-000000001003', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000903'),
    ('00000000-0000-0000-0000-000000001004', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000904');

-- Insert reward items
INSERT INTO reward_items (id, name, description, image_url, points_cost, quantity_available, item_type)
VALUES 
    ('00000000-0000-0000-0000-000000001101', '$10 Amazon Gift Card', 'Digital gift card for Amazon.com', '/images/rewards/amazon-gift-card.png', 500, 100, 'digital'),
    ('00000000-0000-0000-0000-000000001102', 'Verifi AI T-Shirt', 'Premium cotton t-shirt with Verifi AI logo', '/images/rewards/tshirt.png', 750, 50, 'physical'),
    ('00000000-0000-0000-0000-000000001103', 'Cocktail Recipe Book', 'Digital book with premium cocktail recipes', '/images/rewards/cocktail-book.png', 300, 200, 'digital'),
    ('00000000-0000-0000-0000-000000001104', 'Whisky Tasting Experience', 'Guided whisky tasting experience at a local venue', '/images/rewards/whisky-tasting.png', 1500, 10, 'experience'),
    ('00000000-0000-0000-0000-000000001105', '15% Off Next Purchase', 'Discount code for your next purchase at participating retailers', '/images/rewards/discount.png', 200, 500, 'discount');

-- Insert responsible drinking resources
INSERT INTO responsible_drinking_resources (id, title, content, resource_type, image_url)
VALUES 
    ('00000000-0000-0000-0000-000000001201', 'Understanding Alcohol Units', 'Learn about alcohol units and how they affect your body. This guide explains how to calculate units and make informed decisions about consumption.', 'article', '/images/resources/alcohol-units.png'),
    ('00000000-0000-0000-0000-000000001202', 'Signs of Alcohol Dependency', 'Educational video about recognizing the signs of alcohol dependency and where to seek help.', 'video', '/images/resources/dependency-signs.png'),
    ('00000000-0000-0000-0000-000000001203', 'Alcohol and Health Effects', 'Comprehensive infographic showing the short and long-term health effects of alcohol consumption.', 'infographic', '/images/resources/health-effects.png'),
    ('00000000-0000-0000-0000-000000001204', 'Responsible Drinking Quiz', 'Test your knowledge about responsible alcohol consumption with this interactive quiz.', 'quiz', '/images/resources/quiz.png'),
    ('00000000-0000-0000-0000-000000001205', 'National Helpline', 'Information about the national alcohol helpline and support services.', 'external', '/images/resources/helpline.png');

-- Insert user resource interactions
INSERT INTO user_resource_interactions (id, user_id, resource_id, interaction_type, points_earned)
VALUES 
    ('00000000-0000-0000-0000-000000001301', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000001201', 'complete', 50),
    ('00000000-0000-0000-0000-000000001302', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000001202', 'complete', 50),
    ('00000000-0000-0000-0000-000000001303', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000001203', 'complete', 50),
    ('00000000-0000-0000-0000-000000001304', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000001204', 'complete', 50),
    ('00000000-0000-0000-0000-000000001305', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000001201', 'view', 10);

-- Insert AI chat messages
INSERT INTO ai_chat_messages (id, user_id, session_id, message, is_user)
VALUES 
    ('00000000-0000-0000-0000-000000001401', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000001501', 'How can I tell if a product is counterfeit?', TRUE),
    ('00000000-0000-0000-0000-000000001402', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000001501', 'There are several ways to identify counterfeit products. First, always check the NFC tag with the Verifi AI app. Authentic products will have a valid, unbroken NFC seal. Look for quality issues like poor printing, spelling errors, or inconsistent packaging. If the price seems too good to be true, it might be counterfeit. Always purchase from authorized retailers. Would you like more specific guidance for a particular product?', FALSE),
    ('00000000-0000-0000-0000-000000001403', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000001501', 'What should I do if I find a counterfeit product?', TRUE),
    ('00000000-0000-0000-0000-000000001404', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000001501', 'If you believe you''ve found a counterfeit product, please report it immediately through the Verifi AI app. Take photos of the product, packaging, and any security features. Note the location where you purchased it. Your report helps protect other consumers and allows manufacturers to investigate. You''ll earn reward points for verified counterfeit reports, and you''re helping to combat illegal trade. Would you like me to guide you through the reporting process?', FALSE);

-- Insert AI detected anomalies
INSERT INTO ai_detected_anomalies (id, anomaly_type, description, confidence, data, status)
VALUES 
    ('00000000-0000-0000-0000-000000001601', 'Geographic Cluster', 'Unusual concentration of validation attempts in Miami area', 0.87, '{"location": {"lat": 25.7617, "lng": -80.1918}, "radius_km": 5, "product_ids": ["00000000-0000-0000-0000-000000000302", "00000000-0000-0000-0000-000000000303"], "timeframe": "2023-08-10 to 2023-08-20"}', 'investigating'),
    ('00000000-0000-0000-0000-000000001602', 'Validation Pattern', 'Multiple failed validations from same device', 0.92, '{"device_id": "d789efgh-ijkl-4567-mnop-qrstuvwxyz12", "attempts": 8, "timeframe": "2023-08-15 to 2023-08-16", "ip_range": "192.168.1.x"}', 'new');

-- Insert notification templates
INSERT INTO notification_templates (id, name, subject, body, template_type)
VALUES 
    ('00000000-0000-0000-0000-000000001701', 'verification_success', 'Product Verification Successful', 'Congratulations! You have successfully verified a {{product_name}} as authentic. You''ve earned {{points}} points!', 'email'),
    ('00000000-0000-0000-0000-000000001702', 'counterfeit_report', 'Counterfeit Report Received', 'Thank you for reporting a potential counterfeit {{product_name}}. Our team is investigating and you''ve earned {{points}} points for your vigilance.', 'email'),
    ('00000000-0000-0000-0000-000000001703', 'reward_redemption', 'Reward Redemption Confirmation', 'You have successfully redeemed {{points}} points for {{reward_name}}. {{delivery_instructions}}', 'email'),
    ('00000000-0000-0000-0000-000000001704', 'verification_push', 'Verification Success', 'You verified {{product_name}} and earned {{points}} points!', 'push'),
    ('00000000-0000-0000-0000-000000001705', 'counterfeit_alert', 'Counterfeit Alert', 'A counterfeit {{product_name}} was reported in your area. Stay vigilant!', 'push');

-- Insert notifications
INSERT INTO notifications (id, user_id, template_id, title, message, notification_type, is_read)
VALUES 
    ('00000000-0000-0000-0000-000000001801', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000001701', 'Product Verification Successful', 'Congratulations! You have successfully verified a Johnnie Walker Black Label as authentic. You''ve earned 50 points!', 'email', TRUE),
    ('00000000-0000-0000-0000-000000001802', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000001702', 'Counterfeit Report Received', 'Thank you for reporting a potential counterfeit Grey Goose La Poire. Our team is investigating and you''ve earned 300 points for your vigilance.', 'email', TRUE),
    ('00000000-0000-0000-0000-000000001803', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000001704', 'Verification Attempt', 'You attempted to verify Grey Goose La Poire and earned 50 points for reporting a potential counterfeit!', 'push', FALSE),
    ('00000000-0000-0000-0000-000000001804', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000001705', 'Counterfeit Alert', 'A counterfeit Grey Goose La Poire was reported in your area. Stay vigilant!', 'push', FALSE);

-- Insert analytics data
INSERT INTO analytics_data (id, data_type, data_date, data_value)
VALUES 
    ('00000000-0000-0000-0000-000000001901', 'daily_verifications', '2023-08-15', '{"total": 124, "authentic": 120, "counterfeit": 4, "by_category": {"Whisky": 68, "Vodka": 32, "Cognac": 24}, "by_location": {"USA": 80, "Canada": 24, "UK": 20}}'),
    ('00000000-0000-0000-0000-000000001902', 'daily_verifications', '2023-08-16', '{"total": 136, "authentic": 130, "counterfeit": 6, "by_category": {"Whisky": 72, "Vodka": 38, "Cognac": 26}, "by_location": {"USA": 85, "Canada": 28, "UK": 23}}'),
    ('00000000-0000-0000-0000-000000001903', 'daily_verifications', '2023-08-17', '{"total": 142, "authentic": 135, "counterfeit": 7, "by_category": {"Whisky": 75, "Vodka": 40, "Cognac": 27}, "by_location": {"USA": 90, "Canada": 30, "UK": 22}}'),
    ('00000000-0000-0000-0000-000000001904', 'monthly_summary', '2023-08-01', '{"total_verifications": 3842, "authentic": 3720, "counterfeit": 122, "new_users": 856, "active_users": 2450, "rewards_issued": 192500, "rewards_redeemed": 86000}'),
    ('00000000-0000-0000-0000-000000001905', 'counterfeit_hotspots', '2023-08-01', '{"hotspots": [{"location": "Miami, FL", "count": 28, "products": ["Grey Goose La Poire", "Hennessy XO"]}, {"location": "Los Angeles, CA", "count": 22, "products": ["Johnnie Walker Blue Label", "Jack Daniel''s Single Barrel"]}, {"location": "New York, NY", "count": 18, "products": ["Grey Goose Original", "Hennessy VSOP"]}]}');