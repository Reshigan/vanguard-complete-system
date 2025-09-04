const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// South African specific data
const SA_PROVINCES = ['Gauteng', 'Western Cape', 'KwaZulu-Natal'];
const SA_CITIES = {
  'Gauteng': ['Johannesburg', 'Pretoria', 'Soweto'],
  'Western Cape': ['Cape Town', 'Stellenbosch', 'Paarl'],
  'KwaZulu-Natal': ['Durban', 'Pietermaritzburg', 'Newcastle']
};

const ALCOHOL_CATEGORIES = ['whiskey', 'brandy', 'vodka', 'gin', 'wine', 'beer'];

exports.seed = async function(knex) {
  // Clear existing data
  await knex('repeat_offenders').del();
  await knex('fraud_patterns').del();
  await knex('customer_complaints').del();
  await knex('channel_analytics').del();
  await knex('rewards_redemptions').del();
  await knex('rewards_catalog').del();
  await knex('rewards_transactions').del();
  await knex('ai_chat_sessions').del();
  await knex('ml_training_data').del();
  await knex('refresh_tokens').del();
  await knex('counterfeit_reports').del();
  await knex('supply_chain_events').del();
  await knex('nfc_tokens').del();
  await knex('products').del();
  await knex('users').del();
  await knex('manufacturers').del();

  // Create manufacturers
  const manufacturers = [
    {
      id: uuidv4(),
      name: 'South African Breweries',
      country: 'South Africa',
      registration_number: 'ZA1234567890',
      contact_info: JSON.stringify({
        email: 'contact@sab.co.za',
        phone: '+27123456789',
        address: 'Johannesburg, Gauteng'
      }),
      blockchain_address: '0x' + crypto.randomBytes(20).toString('hex'),
      created_at: new Date('2023-01-01'),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Distell Group',
      country: 'South Africa',
      registration_number: 'ZA0987654321',
      contact_info: JSON.stringify({
        email: 'contact@distell.co.za',
        phone: '+27987654321',
        address: 'Cape Town, Western Cape'
      }),
      blockchain_address: '0x' + crypto.randomBytes(20).toString('hex'),
      created_at: new Date('2023-01-01'),
      updated_at: new Date()
    }
  ];
  await knex('manufacturers').insert(manufacturers);

  // Create products
  const products = [];
  manufacturers.forEach(manufacturer => {
    for (let i = 0; i < 3; i++) {
      products.push({
        id: uuidv4(),
        manufacturer_id: manufacturer.id,
        name: `${manufacturer.name.split(' ')[0]} Premium ${ALCOHOL_CATEGORIES[i]}`,
        category: ALCOHOL_CATEGORIES[i],
        description: `Premium ${ALCOHOL_CATEGORIES[i]} from ${manufacturer.name}`,
        alcohol_content: 40 + Math.random() * 10,
        volume: 750,
        created_at: new Date('2023-01-01'),
        updated_at: new Date()
      });
    }
  });
  await knex('products').insert(products);

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);
  const users = [
    {
      id: uuidv4(),
      email: 'admin@authentiguard.co.za',
      password: hashedPassword,
      phone: '+27123456789',
      role: 'admin',
      profile: JSON.stringify({
        firstName: 'Admin',
        lastName: 'User',
        department: 'Operations'
      }),
      rewards_balance: 0,
      created_at: new Date('2023-01-01'),
      updated_at: new Date()
    }
  ];

  // Add manufacturer users
  manufacturers.forEach(manufacturer => {
    users.push({
      id: uuidv4(),
      email: `contact@${manufacturer.name.toLowerCase().replace(/\s+/g, '')}.co.za`,
      password: hashedPassword,
      phone: '+27' + Math.floor(Math.random() * 1000000000),
      role: 'manufacturer',
      profile: JSON.stringify({
        firstName: 'Manager',
        lastName: 'User',
        company: manufacturer.name,
        manufacturerId: manufacturer.id
      }),
      rewards_balance: 0,
      created_at: new Date('2023-01-01'),
      updated_at: new Date()
    });
  });

  // Add consumer users
  for (let i = 0; i < 20; i++) {
    const province = SA_PROVINCES[Math.floor(Math.random() * SA_PROVINCES.length)];
    const city = SA_CITIES[province][Math.floor(Math.random() * SA_CITIES[province].length)];
    
    users.push({
      id: uuidv4(),
      email: `user${i}@example.com`,
      password: hashedPassword,
      phone: '+27' + Math.floor(Math.random() * 1000000000),
      role: 'consumer',
      profile: JSON.stringify({
        firstName: `User${i}`,
        lastName: 'Consumer',
        city: city,
        province: province
      }),
      rewards_balance: Math.floor(Math.random() * 5000),
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      updated_at: new Date()
    });
  }
  await knex('users').insert(users);

  // Create NFC tokens
  const nfcTokens = [];
  for (let i = 0; i < 50; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const productionDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    const expiryDate = new Date(productionDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000);
    
    nfcTokens.push({
      id: uuidv4(),
      token_hash: crypto.randomBytes(32).toString('hex'),
      product_id: product.id,
      manufacturer_id: product.manufacturer_id,
      batch_number: `BATCH-${Math.floor(Math.random() * 900000) + 100000}`,
      production_date: productionDate,
      expiry_date: expiryDate,
      blockchain_tx_hash: '0x' + crypto.randomBytes(32).toString('hex'),
      status: ['active', 'validated', 'invalidated'][Math.floor(Math.random() * 3)],
      validated_at: Math.random() > 0.5 ? new Date() : null,
      created_at: productionDate,
      updated_at: new Date()
    });
  }
  await knex('nfc_tokens').insert(nfcTokens);

  // Create supply chain events
  const supplyChainEvents = [];
  const eventTypes = ['production', 'distribution', 'retail', 'validation'];
  
  for (let i = 0; i < 100; i++) {
    const token = nfcTokens[Math.floor(Math.random() * nfcTokens.length)];
    const user = users.filter(u => u.role !== 'admin')[Math.floor(Math.random() * users.filter(u => u.role !== 'admin').length)];
    
    supplyChainEvents.push({
      id: uuidv4(),
      token_id: token.id,
      event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      stakeholder_id: user.id,
      stakeholder_type: user.role,
      metadata: JSON.stringify({
        device: 'mobile',
        ip: '192.168.1.' + Math.floor(Math.random() * 255)
      }),
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    });
  }
  await knex('supply_chain_events').insert(supplyChainEvents);

  // Create counterfeit reports
  const counterfeitReports = [];
  const reportStatuses = ['pending', 'investigating', 'confirmed', 'false_positive'];
  const consumerUsers = users.filter(u => u.role === 'consumer');
  
  for (let i = 0; i < 50; i++) {
    const token = nfcTokens[Math.floor(Math.random() * nfcTokens.length)];
    const reporter = consumerUsers[Math.floor(Math.random() * consumerUsers.length)];
    const status = reportStatuses[Math.floor(Math.random() * reportStatuses.length)];
    
    counterfeitReports.push({
      id: uuidv4(),
      token_id: token.id,
      reporter_id: reporter.id,
      photos: JSON.stringify(['photo1.jpg', 'photo2.jpg']),
      description: 'Suspicious product reported via mobile app',
      status: status,
      reward_amount: status === 'confirmed' ? Math.floor(Math.random() * 450) + 50 : 0,
      notes: 'Investigation in progress',
      metadata: JSON.stringify({
        deviceInfo: 'Mobile App',
        reportSource: 'mobile_app'
      }),
      created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      updated_at: new Date()
    });
  }
  await knex('counterfeit_reports').insert(counterfeitReports);

  // Create rewards catalog
  const rewardsCatalog = [
    {
      id: uuidv4(),
      name: 'R50 Checkers Voucher',
      description: 'Get R50 off your next Checkers purchase',
      points_required: 500,
      category: 'discount',
      partner_name: 'Checkers',
      terms_conditions: JSON.stringify(['Valid for 30 days', 'One per customer']),
      is_active: true,
      stock_quantity: 100,
      image_url: 'https://example.com/checkers.jpg',
      created_at: new Date('2023-01-01'),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Free Coffee at Vida e Caffè',
      description: 'Enjoy a complimentary coffee',
      points_required: 200,
      category: 'gift',
      partner_name: 'Vida e Caffè',
      terms_conditions: JSON.stringify(['Valid for 14 days']),
      is_active: true,
      stock_quantity: 50,
      image_url: 'https://example.com/coffee.jpg',
      created_at: new Date('2023-01-01'),
      updated_at: new Date()
    }
  ];
  await knex('rewards_catalog').insert(rewardsCatalog);

  // Create ML training data
  const mlTrainingData = [];
  for (let i = 0; i < 100; i++) {
    const token = nfcTokens[Math.floor(Math.random() * nfcTokens.length)];
    const isCounterfeit = Math.random() < 0.15; // 15% counterfeit rate
    
    mlTrainingData.push({
      id: uuidv4(),
      token_id: token.id,
      features: JSON.stringify({
        location_variance: Math.random() * 100,
        time_pattern_anomaly: Math.random(),
        validation_frequency: Math.floor(Math.random() * 50),
        channel_trust_score: Math.random(),
        price_deviation: (Math.random() - 0.5) * 100,
        user_behavior_score: Math.random()
      }),
      is_counterfeit: isCounterfeit,
      confidence_score: 0.5 + Math.random() * 0.49,
      detected_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      detection_metadata: JSON.stringify({
        model_version: '1.0.0',
        detection_method: 'neural_network'
      }),
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updated_at: new Date()
    });
  }
  await knex('ml_training_data').insert(mlTrainingData);

  // Create fraud patterns
  const fraudPatterns = [
    {
      id: uuidv4(),
      pattern_name: 'Geographic Anomaly Detection',
      pattern_rules: JSON.stringify({
        max_distance_km: 500,
        time_window_hours: 24
      }),
      accuracy_score: 0.8734,
      detections_count: 23,
      geographic_hotspots: JSON.stringify(['Johannesburg CBD', 'Cape Town Harbor']),
      time_patterns: JSON.stringify({
        peak_hours: [22, 23, 0, 1, 2],
        peak_days: ['Friday', 'Saturday']
      }),
      product_categories: JSON.stringify(['whiskey', 'brandy']),
      is_active: true,
      created_at: new Date('2023-06-01'),
      updated_at: new Date()
    }
  ];
  await knex('fraud_patterns').insert(fraudPatterns);

  console.log('Sample seed data created successfully!');
  console.log(`Created:
    - ${manufacturers.length} manufacturers
    - ${products.length} products
    - ${users.length} users
    - ${nfcTokens.length} NFC tokens
    - ${supplyChainEvents.length} supply chain events
    - ${counterfeitReports.length} counterfeit reports
    - ${rewardsCatalog.length} rewards catalog items
    - ${mlTrainingData.length} ML training data points
    - ${fraudPatterns.length} fraud patterns
  `);
};