-- South African Alcohol Industry Data Migration
-- This migration updates the system with SA-specific alcohol brands, retailers, and locations

-- Clear existing demo data (optional - comment out to keep existing)
TRUNCATE TABLE validations, products, manufacturers, users RESTART IDENTITY CASCADE;

-- South African Alcohol Manufacturers
INSERT INTO manufacturers (id, name, description, website, verified, trust_score, created_at) VALUES
(gen_random_uuid(), 'South African Breweries (SAB)', 'Largest brewer in South Africa, part of AB InBev', 'https://www.sab.co.za', true, 95, NOW() - INTERVAL '20 years'),
(gen_random_uuid(), 'Distell Group', 'Leading producer of wines, spirits and ciders', 'https://www.distell.co.za', true, 92, NOW() - INTERVAL '15 years'),
(gen_random_uuid(), 'Heineken South Africa', 'Premium beer manufacturer', 'https://www.heineken.com/za', true, 90, NOW() - INTERVAL '10 years'),
(gen_random_uuid(), 'KWV', 'Wine and spirits producer since 1918', 'https://www.kwv.co.za', true, 88, NOW() - INTERVAL '100 years'),
(gen_random_uuid(), 'DGB (Douglas Green Bellingham)', 'Premium wine producer', 'https://www.dgb.co.za', true, 85, NOW() - INTERVAL '25 years'),
(gen_random_uuid(), 'Pernod Ricard South Africa', 'International spirits company', 'https://www.pernod-ricard.com/za', true, 93, NOW() - INTERVAL '30 years'),
(gen_random_uuid(), 'Diageo South Africa', 'Premium spirits manufacturer', 'https://www.diageo.com', true, 94, NOW() - INTERVAL '25 years'),
(gen_random_uuid(), 'Cape Brewing Company', 'Craft beer producer', 'https://www.capebrewing.co.za', true, 82, NOW() - INTERVAL '5 years'),
(gen_random_uuid(), 'Stellenbosch Vineyards', 'Premium wine estates', 'https://www.stellenboschvineyards.co.za', true, 87, NOW() - INTERVAL '50 years'),
(gen_random_uuid(), 'Robertson Winery', 'Award-winning wine producer', 'https://www.robertsonwinery.co.za', true, 86, NOW() - INTERVAL '75 years');

-- Get manufacturer IDs for product insertion
WITH manufacturer_ids AS (
  SELECT id, name FROM manufacturers WHERE name IN (
    'South African Breweries (SAB)',
    'Distell Group',
    'Heineken South Africa',
    'KWV',
    'DGB (Douglas Green Bellingham)',
    'Pernod Ricard South Africa',
    'Diageo South Africa',
    'Cape Brewing Company',
    'Stellenbosch Vineyards',
    'Robertson Winery'
  )
)

-- South African Alcohol Products
INSERT INTO products (name, description, manufacturer_id, category, sku, batch_number, manufacturing_date, expiry_date, metadata, created_at)
SELECT 
  p.product_name,
  p.product_description,
  m.id,
  p.category,
  p.sku,
  p.batch_number,
  p.manufacturing_date,
  p.expiry_date,
  p.metadata::jsonb,
  p.created_at
FROM (VALUES
  -- SAB Products
  ('Castle Lager 750ml', 'South Africa''s National Beer since 1895', 'South African Breweries (SAB)', 'Beer', 'SAB-CASTLE-750', 'BATCH-2024-001', '2024-01-01'::date, '2025-01-01'::date, '{"alcohol_content": "5%", "volume": "750ml", "type": "Lager"}', NOW() - INTERVAL '1 month'),
  ('Castle Lite 440ml 6-Pack', 'Premium light beer', 'South African Breweries (SAB)', 'Beer', 'SAB-CLITE-440-6', 'BATCH-2024-002', '2024-01-15'::date, '2025-01-15'::date, '{"alcohol_content": "4%", "volume": "440ml", "pack_size": "6"}', NOW() - INTERVAL '2 weeks'),
  ('Black Label 750ml', 'Carling Black Label - Be The Champion', 'South African Breweries (SAB)', 'Beer', 'SAB-BLACK-750', 'BATCH-2024-003', '2024-02-01'::date, '2025-02-01'::date, '{"alcohol_content": "5.5%", "volume": "750ml", "type": "Lager"}', NOW() - INTERVAL '3 weeks'),
  ('Hansa Pilsener 440ml', 'Premium Pilsener', 'South African Breweries (SAB)', 'Beer', 'SAB-HANSA-440', 'BATCH-2024-004', '2024-02-15'::date, '2025-02-15'::date, '{"alcohol_content": "4.5%", "volume": "440ml", "type": "Pilsener"}', NOW() - INTERVAL '1 week'),
  
  -- Distell Products
  ('Savanna Dry 330ml', 'Premium Dry Cider', 'Distell Group', 'Cider', 'DIST-SAV-330', 'BATCH-2024-005', '2024-01-20'::date, '2025-01-20'::date, '{"alcohol_content": "6%", "volume": "330ml", "type": "Dry Cider"}', NOW() - INTERVAL '2 months'),
  ('Hunters Gold 440ml', 'Premium Cider', 'Distell Group', 'Cider', 'DIST-HUNT-440', 'BATCH-2024-006', '2024-01-25'::date, '2025-01-25'::date, '{"alcohol_content": "5.5%", "volume": "440ml", "type": "Cider"}', NOW() - INTERVAL '1 month'),
  ('Klipdrift Premium Brandy 750ml', 'South African Brandy', 'Distell Group', 'Spirits', 'DIST-KLIP-750', 'BATCH-2024-007', '2023-06-01'::date, '2033-06-01'::date, '{"alcohol_content": "43%", "volume": "750ml", "type": "Brandy", "age": "5 years"}', NOW() - INTERVAL '6 months'),
  ('Richelieu Brandy 750ml', 'Premium Brandy', 'Distell Group', 'Spirits', 'DIST-RICH-750', 'BATCH-2024-008', '2023-07-01'::date, '2033-07-01'::date, '{"alcohol_content": "43%", "volume": "750ml", "type": "Brandy", "age": "10 years"}', NOW() - INTERVAL '5 months'),
  ('Amarula Cream Liqueur 750ml', 'Marula Fruit Cream Liqueur', 'Distell Group', 'Spirits', 'DIST-AMAR-750', 'BATCH-2024-009', '2023-08-01'::date, '2025-08-01'::date, '{"alcohol_content": "17%", "volume": "750ml", "type": "Cream Liqueur"}', NOW() - INTERVAL '4 months'),
  
  -- Heineken Products
  ('Heineken Lager 330ml', 'Premium International Beer', 'Heineken South Africa', 'Beer', 'HEIN-LAG-330', 'BATCH-2024-010', '2024-02-01'::date, '2025-02-01'::date, '{"alcohol_content": "5%", "volume": "330ml", "type": "Lager", "origin": "Netherlands"}', NOW() - INTERVAL '1 month'),
  ('Amstel Lager 440ml', 'Premium Beer', 'Heineken South Africa', 'Beer', 'HEIN-AMST-440', 'BATCH-2024-011', '2024-02-05'::date, '2025-02-05'::date, '{"alcohol_content": "5%", "volume": "440ml", "type": "Lager"}', NOW() - INTERVAL '3 weeks'),
  ('Windhoek Draught 440ml', 'Pure Beer', 'Heineken South Africa', 'Beer', 'HEIN-WIND-440', 'BATCH-2024-012', '2024-02-10'::date, '2025-02-10'::date, '{"alcohol_content": "4%", "volume": "440ml", "type": "Lager", "origin": "Namibia"}', NOW() - INTERVAL '2 weeks'),
  
  -- KWV Products
  ('KWV 10 Year Old Brandy 750ml', 'Premium Aged Brandy', 'KWV', 'Spirits', 'KWV-BR10-750', 'BATCH-2024-013', '2014-01-01'::date, '2034-01-01'::date, '{"alcohol_content": "38%", "volume": "750ml", "type": "Brandy", "age": "10 years"}', NOW() - INTERVAL '1 year'),
  ('KWV Cabernet Sauvignon 750ml', 'Premium Red Wine', 'KWV', 'Wine', 'KWV-CAB-750', 'BATCH-2024-014', '2023-03-01'::date, '2028-03-01'::date, '{"alcohol_content": "14%", "volume": "750ml", "type": "Red Wine", "varietal": "Cabernet Sauvignon", "vintage": "2023"}', NOW() - INTERVAL '6 months'),
  ('KWV Chenin Blanc 750ml', 'Premium White Wine', 'KWV', 'Wine', 'KWV-CHEN-750', 'BATCH-2024-015', '2023-02-01'::date, '2026-02-01'::date, '{"alcohol_content": "13%", "volume": "750ml", "type": "White Wine", "varietal": "Chenin Blanc", "vintage": "2023"}', NOW() - INTERVAL '7 months'),
  
  -- DGB Products
  ('Boschendal 1685 Shiraz 750ml', 'Premium Red Wine', 'DGB (Douglas Green Bellingham)', 'Wine', 'DGB-BOSH-750', 'BATCH-2024-016', '2022-04-01'::date, '2032-04-01'::date, '{"alcohol_content": "14.5%", "volume": "750ml", "type": "Red Wine", "varietal": "Shiraz", "vintage": "2022"}', NOW() - INTERVAL '1 year'),
  ('Bellingham Pinotage 750ml', 'Estate Wine', 'DGB (Douglas Green Bellingham)', 'Wine', 'DGB-BELL-750', 'BATCH-2024-017', '2023-03-15'::date, '2030-03-15'::date, '{"alcohol_content": "14%", "volume": "750ml", "type": "Red Wine", "varietal": "Pinotage", "vintage": "2023"}', NOW() - INTERVAL '8 months'),
  
  -- Pernod Ricard Products
  ('Jameson Irish Whiskey 750ml', 'Triple Distilled Irish Whiskey', 'Pernod Ricard South Africa', 'Spirits', 'PERN-JAME-750', 'BATCH-2024-018', '2020-01-01'::date, '2040-01-01'::date, '{"alcohol_content": "40%", "volume": "750ml", "type": "Whiskey", "origin": "Ireland"}', NOW() - INTERVAL '2 years'),
  ('Beefeater Gin 750ml', 'London Dry Gin', 'Pernod Ricard South Africa', 'Spirits', 'PERN-BEEF-750', 'BATCH-2024-019', '2023-05-01'::date, '2033-05-01'::date, '{"alcohol_content": "40%", "volume": "750ml", "type": "Gin", "origin": "UK"}', NOW() - INTERVAL '9 months'),
  
  -- Diageo Products
  ('Johnnie Walker Black Label 750ml', '12 Year Old Scotch Whisky', 'Diageo South Africa', 'Spirits', 'DIAG-JWBL-750', 'BATCH-2024-020', '2012-01-01'::date, '2042-01-01'::date, '{"alcohol_content": "40%", "volume": "750ml", "type": "Scotch Whisky", "age": "12 years"}', NOW() - INTERVAL '3 years'),
  ('Smirnoff Vodka 750ml', 'Triple Distilled Vodka', 'Diageo South Africa', 'Spirits', 'DIAG-SMIR-750', 'BATCH-2024-021', '2023-06-01'::date, '2033-06-01'::date, '{"alcohol_content": "43%", "volume": "750ml", "type": "Vodka"}', NOW() - INTERVAL '8 months'),
  ('Captain Morgan Spiced Gold 750ml', 'Caribbean Rum', 'Diageo South Africa', 'Spirits', 'DIAG-CAPT-750', 'BATCH-2024-022', '2023-07-01'::date, '2033-07-01'::date, '{"alcohol_content": "35%", "volume": "750ml", "type": "Rum", "origin": "Caribbean"}', NOW() - INTERVAL '7 months'),
  
  -- Craft Beer Products
  ('CBC Amber Weiss 440ml', 'Craft Wheat Beer', 'Cape Brewing Company', 'Beer', 'CBC-AMBER-440', 'BATCH-2024-023', '2024-01-15'::date, '2024-07-15'::date, '{"alcohol_content": "5.3%", "volume": "440ml", "type": "Wheat Beer", "craft": true}', NOW() - INTERVAL '1 month'),
  ('CBC Krystal Weiss 440ml', 'Craft Wheat Beer', 'Cape Brewing Company', 'Beer', 'CBC-KRYST-440', 'BATCH-2024-024', '2024-01-20'::date, '2024-07-20'::date, '{"alcohol_content": "5%", "volume": "440ml", "type": "Wheat Beer", "craft": true}', NOW() - INTERVAL '3 weeks')
) AS p(product_name, product_description, manufacturer_name, category, sku, batch_number, manufacturing_date, expiry_date, metadata, created_at)
JOIN manufacturer_ids m ON m.name = p.manufacturer_name;

-- South African Retailers and Distributors (as users)
INSERT INTO users (username, email, password_hash, role, total_points, level, metadata, created_at) VALUES
-- Major Retailers
('tops_liquor_sandton', 'sandton@tops.co.za', '$2b$10$YourHashedPasswordHere', 'retailer', 0, 1, '{"store_name": "Tops at Sandton City", "chain": "Tops", "location": "Sandton"}', NOW() - INTERVAL '2 years'),
('makro_liquor_jhb', 'liquor.jhb@makro.co.za', '$2b$10$YourHashedPasswordHere', 'retailer', 0, 1, '{"store_name": "Makro Liquor Johannesburg", "chain": "Makro", "location": "Johannesburg"}', NOW() - INTERVAL '3 years'),
('picknpay_liquor_cape', 'liquor.cape@pnp.co.za', '$2b$10$YourHashedPasswordHere', 'retailer', 0, 1, '{"store_name": "Pick n Pay Liquor V&A Waterfront", "chain": "Pick n Pay", "location": "Cape Town"}', NOW() - INTERVAL '2 years'),
('checkers_liquorshop_durban', 'liquor.durban@checkers.co.za', '$2b$10$YourHashedPasswordHere', 'retailer', 0, 1, '{"store_name": "Checkers LiquorShop Gateway", "chain": "Checkers", "location": "Durban"}', NOW() - INTERVAL '18 months'),
('ultra_liquors_pretoria', 'pretoria@ultraliquors.co.za', '$2b$10$YourHashedPasswordHere', 'retailer', 0, 1, '{"store_name": "Ultra Liquors Menlyn", "chain": "Ultra Liquors", "location": "Pretoria"}', NOW() - INTERVAL '1 year'),
('liquor_city_pe', 'pe@liquorcity.co.za', '$2b$10$YourHashedPasswordHere', 'retailer', 0, 1, '{"store_name": "Liquor City Walmer", "chain": "Liquor City", "location": "Port Elizabeth"}', NOW() - INTERVAL '2 years'),
('norman_goodfellows_stellenbosch', 'stellenbosch@normangoodfellows.co.za', '$2b$10$YourHashedPasswordHere', 'retailer', 0, 1, '{"store_name": "Norman Goodfellows Stellenbosch", "chain": "Norman Goodfellows", "location": "Stellenbosch", "premium": true}', NOW() - INTERVAL '5 years'),

-- Independent Retailers
('bobs_bottle_store', 'bob@bobsbottlestore.co.za', '$2b$10$YourHashedPasswordHere', 'retailer', 0, 1, '{"store_name": "Bob''s Bottle Store", "type": "independent", "location": "Randburg"}', NOW() - INTERVAL '10 years'),
('township_liquors_soweto', 'info@townshipliquors.co.za', '$2b$10$YourHashedPasswordHere', 'retailer', 0, 1, '{"store_name": "Township Liquors", "type": "independent", "location": "Soweto"}', NOW() - INTERVAL '5 years'),
('coastal_cellars_hermanus', 'info@coastalcellars.co.za', '$2b$10$YourHashedPasswordHere', 'retailer', 0, 1, '{"store_name": "Coastal Cellars", "type": "independent", "location": "Hermanus", "specialty": "wine"}', NOW() - INTERVAL '3 years'),

-- Consumers
('thabo_molefe', 'thabo.molefe@gmail.com', '$2b$10$YourHashedPasswordHere', 'consumer', 1250, 3, '{"location": "Johannesburg", "preferences": ["beer", "whisky"]}', NOW() - INTERVAL '6 months'),
('sarah_vanderwalt', 'sarah.vdw@gmail.com', '$2b$10$YourHashedPasswordHere', 'consumer', 850, 2, '{"location": "Cape Town", "preferences": ["wine", "gin"]}', NOW() - INTERVAL '8 months'),
('sipho_dlamini', 'sipho.dlamini@yahoo.com', '$2b$10$YourHashedPasswordHere', 'consumer', 2100, 4, '{"location": "Durban", "preferences": ["beer", "cider"]}', NOW() - INTERVAL '1 year'),
('linda_naidoo', 'linda.naidoo@gmail.com', '$2b$10$YourHashedPasswordHere', 'consumer', 650, 2, '{"location": "Durban", "preferences": ["wine", "spirits"]}', NOW() - INTERVAL '4 months'),
('johan_kruger', 'johan.kruger@outlook.com', '$2b$10$YourHashedPasswordHere', 'consumer', 1800, 3, '{"location": "Pretoria", "preferences": ["brandy", "beer"]}', NOW() - INTERVAL '10 months'),
('nomsa_khumalo', 'nomsa.k@gmail.com', '$2b$10$YourHashedPasswordHere', 'consumer', 450, 1, '{"location": "Soweto", "preferences": ["cider", "beer"]}', NOW() - INTERVAL '2 months'),
('pieter_botha', 'pieter.botha@gmail.com', '$2b$10$YourHashedPasswordHere', 'consumer', 3200, 5, '{"location": "Stellenbosch", "preferences": ["wine"], "collector": true}', NOW() - INTERVAL '2 years'),
('fatima_adams', 'fatima.adams@gmail.com', '$2b$10$YourHashedPasswordHere', 'consumer', 980, 2, '{"location": "Cape Town", "preferences": ["spirits", "wine"]}', NOW() - INTERVAL '5 months'),
('david_cohen', 'david.cohen@gmail.com', '$2b$10$YourHashedPasswordHere', 'consumer', 1450, 3, '{"location": "Johannesburg", "preferences": ["whisky", "wine"]}', NOW() - INTERVAL '7 months'),
('grace_mbeki', 'grace.mbeki@gmail.com', '$2b$10$YourHashedPasswordHere', 'consumer', 550, 2, '{"location": "Port Elizabeth", "preferences": ["beer", "cider"]}', NOW() - INTERVAL '3 months');

-- South African Locations
INSERT INTO locations (latitude, longitude, address, city, state, country, postal_code) VALUES
-- Major Cities
(-26.2041, 28.0473, '1 Sandton Drive', 'Sandton', 'Gauteng', 'South Africa', '2196'),
(-26.1076, 28.0567, '123 Oxford Road', 'Johannesburg', 'Gauteng', 'South Africa', '2196'),
(-33.9249, 18.4241, '1 Waterfront Plaza', 'Cape Town', 'Western Cape', 'South Africa', '8001'),
(-29.8587, 31.0218, '45 Umhlanga Rocks Drive', 'Durban', 'KwaZulu-Natal', 'South Africa', '4320'),
(-25.7479, 28.2293, '234 Church Street', 'Pretoria', 'Gauteng', 'South Africa', '0002'),
(-33.9608, 25.6022, '12 Main Street', 'Port Elizabeth', 'Eastern Cape', 'South Africa', '6001'),
(-33.9321, 18.8602, '56 Dorp Street', 'Stellenbosch', 'Western Cape', 'South Africa', '7600'),
(-26.2614, 27.8871, '789 Vilakazi Street', 'Soweto', 'Gauteng', 'South Africa', '1804'),
(-34.4187, 19.2345, '23 Marine Drive', 'Hermanus', 'Western Cape', 'South Africa', '7200'),
(-26.1520, 28.0400, '456 Rivonia Road', 'Rivonia', 'Gauteng', 'South Africa', '2128'),
(-29.7870, 31.0348, '78 Mahatma Gandhi Road', 'Phoenix', 'KwaZulu-Natal', 'South Africa', '4068'),
(-33.9715, 18.6021, '90 Long Street', 'Cape Town CBD', 'Western Cape', 'South Africa', '8000'),
(-26.0269, 28.0197, '12 Beyers Naude Drive', 'Randburg', 'Gauteng', 'South Africa', '2194'),
(-25.8655, 28.1898, '34 Lynnwood Road', 'Menlyn', 'Gauteng', 'South Africa', '0181'),
(-28.7282, 24.7499, '567 Diamond Street', 'Kimberley', 'Northern Cape', 'South Africa', '8301');

-- Generate NXT tokens for products
INSERT INTO nxt_tokens (id, token_hash, product_id, manufacturer_id, batch_number, production_date, expiry_date, status, created_at)
SELECT 
  gen_random_uuid(),
  'NXT-' || TO_CHAR(NOW(), 'YYYY') || '-' || p.sku || '-' || LPAD(generate_series::text, 4, '0'),
  p.id,
  p.manufacturer_id,
  p.batch_number,
  p.manufacturing_date,
  p.expiry_date,
  CASE 
    WHEN random() < 0.7 THEN 'active'
    WHEN random() < 0.9 THEN 'validated'
    ELSE 'active'
  END,
  NOW() - (random() * INTERVAL '180 days')
FROM products p
CROSS JOIN generate_series(1, 100); -- 100 tokens per product

-- Generate QR codes for products
INSERT INTO qr_codes (product_id, code, scan_count, created_at)
SELECT 
  id,
  'QR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(sku, 1, 8)) || '-' || LPAD(id::text, 8, '0'),
  floor(random() * 500),
  created_at
FROM products;

-- Generate validations with South African context
INSERT INTO validations (user_id, product_id, qr_code_id, location_id, is_authentic, confidence_score, ml_model_version, risk_factors, points_earned, created_at)
SELECT 
  u.id,
  p.id,
  q.id,
  l.id,
  CASE 
    WHEN random() < 0.95 THEN true  -- 95% authentic rate
    ELSE false
  END,
  CASE 
    WHEN random() < 0.95 THEN 0.85 + (random() * 0.15)  -- High confidence for authentic
    ELSE 0.2 + (random() * 0.4)                         -- Low confidence for counterfeit
  END,
  '3.0.' || floor(random() * 10),
  CASE 
    WHEN random() < 0.95 THEN '[]'::jsonb
    ELSE jsonb_build_array(
      CASE floor(random() * 5)
        WHEN 0 THEN 'price_anomaly'
        WHEN 1 THEN 'location_mismatch'
        WHEN 2 THEN 'packaging_deviation'
        WHEN 3 THEN 'batch_inconsistency'
        ELSE 'distribution_anomaly'
      END
    )
  END,
  CASE 
    WHEN random() < 0.95 THEN floor(random() * 50) + 10
    ELSE floor(random() * 100) + 50
  END,
  NOW() - (random() * INTERVAL '365 days')
FROM users u
CROSS JOIN products p
CROSS JOIN qr_codes q ON q.product_id = p.id
CROSS JOIN locations l
WHERE u.role = 'consumer'
  AND random() < 0.1  -- 10% chance of validation per user-product combination
LIMIT 50000;

-- Generate counterfeit reports for South African context
INSERT INTO counterfeit_reports (token_id, reporter_id, location_id, evidence_type, description, status, verified_counterfeit, created_at)
SELECT 
  t.id,
  u.id,
  l.id,
  CASE floor(random() * 5)
    WHEN 0 THEN 'packaging'
    WHEN 1 THEN 'labeling'
    WHEN 2 THEN 'seal_broken'
    WHEN 3 THEN 'suspicious_source'
    ELSE 'quality_issue'
  END,
  CASE floor(random() * 5)
    WHEN 0 THEN 'Label appears to be photocopied, colors are faded'
    WHEN 1 THEN 'Bottle seal was already broken when purchased'
    WHEN 2 THEN 'Purchased from unlicensed vendor at taxi rank'
    WHEN 3 THEN 'Taste and smell different from authentic product'
    ELSE 'Packaging quality is poor, bottle cap loose'
  END,
  CASE 
    WHEN random() < 0.3 THEN 'resolved'
    WHEN random() < 0.6 THEN 'investigating'
    ELSE 'pending'
  END,
  random() < 0.7,  -- 70% verified as counterfeit
  NOW() - (random() * INTERVAL '180 days')
FROM nxt_tokens t
CROSS JOIN users u
CROSS JOIN locations l
WHERE u.role IN ('consumer', 'retailer')
  AND t.status = 'validated'
  AND random() < 0.02  -- 2% of validated tokens get reported
LIMIT 1000;

-- Generate retailer-specific supply chain events
INSERT INTO supply_chain_events (token_id, event_type, location_id, description, metadata, created_at)
SELECT 
  t.id,
  e.event_type,
  l.id,
  e.description,
  e.metadata::jsonb,
  t.created_at + (e.time_offset * INTERVAL '1 day')
FROM nxt_tokens t
CROSS JOIN locations l
CROSS JOIN (VALUES
  ('manufactured', 'Product manufactured and NXT tag attached', '{"facility": "Main Production Plant"}', 0),
  ('quality_check', 'Quality control passed', '{"inspector": "QC Team SA", "result": "passed"}', 1),
  ('warehoused', 'Stored in distribution center', '{"warehouse": "Johannesburg DC", "temperature": "18C"}', 3),
  ('distributed', 'Shipped to retailer', '{"transporter": "DSV Logistics", "vehicle": "TRK-2024-001"}', 5),
  ('received', 'Received at retail location', '{"receiver": "Store Manager", "condition": "good"}', 7),
  ('shelved', 'Placed on retail shelf', '{"location": "Aisle 5, Shelf B", "price": "R89.99"}', 8)
) AS e(event_type, description, metadata, time_offset)
WHERE random() < 0.3  -- 30% of tokens get full supply chain tracking
LIMIT 20000;

-- Update user statistics based on validations
UPDATE users u
SET 
  total_points = COALESCE((
    SELECT SUM(points_earned) 
    FROM validations v 
    WHERE v.user_id = u.id
  ), 0),
  level = CASE 
    WHEN total_points < 100 THEN 1
    WHEN total_points < 500 THEN 2
    WHEN total_points < 2000 THEN 3
    WHEN total_points < 10000 THEN 4
    ELSE 5
  END
WHERE role = 'consumer';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON products(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_validations_location ON validations(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Summary
SELECT 'South African Alcohol Data Migration Complete!' as status;
SELECT 'Entity' as entity, 'Count' as count
UNION ALL
SELECT 'Manufacturers', COUNT(*)::text FROM manufacturers
UNION ALL
SELECT 'Products', COUNT(*)::text FROM products
UNION ALL
SELECT 'Users (Total)', COUNT(*)::text FROM users
UNION ALL
SELECT 'Retailers', COUNT(*)::text FROM users WHERE role = 'retailer'
UNION ALL
SELECT 'Consumers', COUNT(*)::text FROM users WHERE role = 'consumer'
UNION ALL
SELECT 'Locations', COUNT(*)::text FROM locations
UNION ALL
SELECT 'NXT Tokens', COUNT(*)::text FROM nxt_tokens
UNION ALL
SELECT 'Validations', COUNT(*)::text FROM validations
UNION ALL
SELECT 'Counterfeit Reports', COUNT(*)::text FROM counterfeit_reports;