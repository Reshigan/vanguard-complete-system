const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Global manufacturers data
const manufacturers = [
  {
    id: uuidv4(),
    name: 'Vanguard Distillery',
    country: 'Scotland',
    registration_number: 'VG-SCT-001',
    contact_info: {
      email: 'contact@vanguarddistillery.com',
      phone: '+44-1234-567890',
      address: 'Highland Estate, Speyside, Scotland'
    },
    blockchain_address: '0x1234567890123456789012345678901234567890'
  },
  {
    id: uuidv4(),
    name: 'Premium Spirits Co.',
    country: 'Ireland',
    registration_number: 'PS-IRE-002',
    contact_info: {
      email: 'info@premiumspirits.ie',
      phone: '+353-1-234-5678',
      address: 'Dublin Industrial Estate, Dublin, Ireland'
    },
    blockchain_address: '0x2345678901234567890123456789012345678901'
  },
  {
    id: uuidv4(),
    name: 'Bourbon Masters LLC',
    country: 'United States',
    registration_number: 'BM-USA-003',
    contact_info: {
      email: 'contact@bourbonmasters.com',
      phone: '+1-502-555-0123',
      address: 'Kentucky Bourbon Trail, Louisville, KY, USA'
    },
    blockchain_address: '0x3456789012345678901234567890123456789012'
  },
  {
    id: uuidv4(),
    name: 'Sake Excellence Ltd',
    country: 'Japan',
    registration_number: 'SE-JPN-004',
    contact_info: {
      email: 'info@sakeexcellence.jp',
      phone: '+81-3-1234-5678',
      address: 'Kyoto Prefecture, Japan'
    },
    blockchain_address: '0x4567890123456789012345678901234567890123'
  },
  {
    id: uuidv4(),
    name: 'Champagne Royale',
    country: 'France',
    registration_number: 'CR-FRA-005',
    contact_info: {
      email: 'contact@champagneroyale.fr',
      phone: '+33-1-23-45-67-89',
      address: 'Champagne Region, Reims, France'
    },
    blockchain_address: '0x5678901234567890123456789012345678901234'
  },
  {
    id: uuidv4(),
    name: 'Tequila Artesanal',
    country: 'Mexico',
    registration_number: 'TA-MEX-006',
    contact_info: {
      email: 'info@tequilaartesanal.mx',
      phone: '+52-33-1234-5678',
      address: 'Jalisco, Mexico'
    },
    blockchain_address: '0x6789012345678901234567890123456789012345'
  },
  {
    id: uuidv4(),
    name: 'Australian Wine Co.',
    country: 'Australia',
    registration_number: 'AW-AUS-007',
    contact_info: {
      email: 'contact@australianwine.com.au',
      phone: '+61-8-1234-5678',
      address: 'Barossa Valley, South Australia'
    },
    blockchain_address: '0x7890123456789012345678901234567890123456'
  },
  {
    id: uuidv4(),
    name: 'Vodka Premium',
    country: 'Russia',
    registration_number: 'VP-RUS-008',
    contact_info: {
      email: 'info@vodkapremium.ru',
      phone: '+7-495-123-4567',
      address: 'Moscow Region, Russia'
    },
    blockchain_address: '0x8901234567890123456789012345678901234567'
  }
];

// Product categories and types
const productCategories = [
  'Whisky', 'Bourbon', 'Vodka', 'Gin', 'Rum', 'Tequila', 'Wine', 'Champagne', 'Sake', 'Cognac'
];

// Generate products for each manufacturer
const generateProducts = () => {
  const products = [];
  
  const productTemplates = [
    { name: 'Reserve', description: 'Premium aged spirit with exceptional quality', alcohol_content: 40.0, volume: 750 },
    { name: 'Classic', description: 'Traditional recipe with modern refinement', alcohol_content: 38.0, volume: 750 },
    { name: 'Limited Edition', description: 'Exclusive small batch production', alcohol_content: 43.0, volume: 700 },
    { name: 'Single Barrel', description: 'Unique single barrel selection', alcohol_content: 45.0, volume: 750 },
    { name: 'Vintage', description: 'Carefully aged vintage selection', alcohol_content: 42.0, volume: 750 },
    { name: 'Master\'s Choice', description: 'Master distiller\'s personal selection', alcohol_content: 46.0, volume: 700 },
    { name: 'Heritage', description: 'Traditional family recipe', alcohol_content: 40.0, volume: 1000 },
    { name: 'Premium', description: 'High-quality premium offering', alcohol_content: 41.0, volume: 750 }
  ];

  manufacturers.forEach(manufacturer => {
    const manufacturerCategory = productCategories[Math.floor(Math.random() * productCategories.length)];
    
    // Generate 3-5 products per manufacturer
    const numProducts = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numProducts; i++) {
      const template = productTemplates[Math.floor(Math.random() * productTemplates.length)];
      
      products.push({
        id: uuidv4(),
        manufacturer_id: manufacturer.id,
        name: `${manufacturer.name.split(' ')[0]} ${template.name}`,
        category: manufacturerCategory,
        description: template.description,
        alcohol_content: template.alcohol_content,
        volume: template.volume,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) // Random date in last year
      });
    }
  });

  return products;
};

// Generate NFC tokens for products
const generateTokens = (products) => {
  const tokens = [];
  const statuses = ['active', 'validated', 'invalidated'];
  const batchPrefixes = ['VG', 'PS', 'BM', 'SE', 'CR', 'TA', 'AW', 'VP'];

  products.forEach(product => {
    // Generate 10-50 tokens per product
    const numTokens = 10 + Math.floor(Math.random() * 41);
    const batchNumber = `${batchPrefixes[Math.floor(Math.random() * batchPrefixes.length)]}-${Date.now().toString().slice(-6)}`;
    
    for (let i = 0; i < numTokens; i++) {
      const tokenId = uuidv4();
      const tokenHash = crypto.createHash('sha256')
        .update(`${tokenId}-${batchNumber}-${i}`)
        .digest('hex');
      
      const createdAt = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000); // Random date in last 6 months
      const productionDate = new Date(createdAt.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Up to 30 days before creation
      const expiryDate = new Date(productionDate.getTime() + (5 + Math.random() * 10) * 365 * 24 * 60 * 60 * 1000); // 5-15 years from production
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      tokens.push({
        id: tokenId,
        token_hash: tokenHash,
        product_id: product.id,
        manufacturer_id: product.manufacturer_id,
        batch_number: batchNumber,
        production_date: productionDate,
        expiry_date: expiryDate,
        blockchain_tx_hash: `0x${crypto.randomBytes(32).toString('hex')}`,
        status: status,
        validated_at: status === 'validated' ? new Date(createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
        validated_location: status === 'validated' ? `POINT(${-180 + Math.random() * 360} ${-90 + Math.random() * 180})` : null,
        created_at: createdAt
      });
    }
  });

  return tokens;
};

// Generate users (consumers, distributors, etc.)
const generateUsers = () => {
  const users = [];
  const roles = ['consumer', 'distributor', 'manufacturer', 'admin'];
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com'];
  const countries = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'MX'];

  // Generate manufacturer users
  manufacturers.forEach(manufacturer => {
    const email = `admin@${manufacturer.name.toLowerCase().replace(/\s+/g, '')}.com`;
    users.push({
      id: uuidv4(),
      email: email,
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', // 'password123'
      phone: manufacturer.contact_info.phone,
      role: 'manufacturer',
      profile: {
        name: `${manufacturer.name} Admin`,
        company: manufacturer.name,
        country: manufacturer.country,
        manufacturer_id: manufacturer.id
      },
      rewards_balance: 0,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    });
  });

  // Generate consumer users
  for (let i = 0; i < 100; i++) {
    const firstName = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Chris', 'Emma'][Math.floor(Math.random() * 8)];
    const lastName = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'][Math.floor(Math.random() * 8)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    users.push({
      id: uuidv4(),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${domain}`,
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2',
      phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      role: 'consumer',
      profile: {
        name: `${firstName} ${lastName}`,
        country: countries[Math.floor(Math.random() * countries.length)],
        age: 21 + Math.floor(Math.random() * 50)
      },
      rewards_balance: Math.floor(Math.random() * 1000),
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    });
  }

  // Generate distributor users
  for (let i = 0; i < 20; i++) {
    const companyNames = ['Global Distributors', 'Premium Imports', 'Wholesale Partners', 'Distribution Plus'];
    const company = companyNames[Math.floor(Math.random() * companyNames.length)];
    
    users.push({
      id: uuidv4(),
      email: `distributor${i}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2',
      phone: `+1-800-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      role: 'distributor',
      profile: {
        name: `${company} Representative`,
        company: company,
        country: countries[Math.floor(Math.random() * countries.length)]
      },
      rewards_balance: 0,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    });
  }

  return users;
};

// Generate supply chain events
const generateSupplyChainEvents = (tokens, users) => {
  const events = [];
  const eventTypes = ['production', 'distribution', 'retail', 'validation', 'counterfeit_report'];
  
  tokens.forEach(token => {
    // Production event (always first)
    const manufacturerUser = users.find(u => u.role === 'manufacturer' && u.profile.manufacturer_id === token.manufacturer_id);
    if (manufacturerUser) {
      events.push({
        id: uuidv4(),
        token_id: token.id,
        event_type: 'production',
        stakeholder_id: manufacturerUser.id,
        stakeholder_type: 'manufacturer',
        location: `POINT(${-180 + Math.random() * 360} ${-90 + Math.random() * 180})`,
        metadata: {
          batch_number: token.batch_number,
          production_date: token.production_date
        },
        timestamp: token.created_at
      });
    }

    // Random additional events
    const numEvents = Math.floor(Math.random() * 4); // 0-3 additional events
    for (let i = 0; i < numEvents; i++) {
      const eventType = eventTypes[1 + Math.floor(Math.random() * (eventTypes.length - 1))]; // Skip production
      const user = users[Math.floor(Math.random() * users.length)];
      
      events.push({
        id: uuidv4(),
        token_id: token.id,
        event_type: eventType,
        stakeholder_id: user.id,
        stakeholder_type: user.role,
        location: `POINT(${-180 + Math.random() * 360} ${-90 + Math.random() * 180})`,
        metadata: {
          event_details: `${eventType} event for token ${token.token_hash.slice(0, 8)}`
        },
        timestamp: new Date(token.created_at.getTime() + Math.random() * 180 * 24 * 60 * 60 * 1000)
      });
    }
  });

  return events;
};

// Generate counterfeit reports
const generateCounterfeitReports = (tokens, users) => {
  const reports = [];
  const statuses = ['pending', 'investigating', 'confirmed', 'false_positive'];
  const consumerUsers = users.filter(u => u.role === 'consumer');
  
  // Generate reports for ~5% of tokens
  const numReports = Math.floor(tokens.length * 0.05);
  
  for (let i = 0; i < numReports; i++) {
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const reporter = consumerUsers[Math.floor(Math.random() * consumerUsers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days
    
    reports.push({
      id: uuidv4(),
      token_id: token.id,
      reporter_id: reporter.id,
      location: `POINT(${-180 + Math.random() * 360} ${-90 + Math.random() * 180})`,
      photos: [`report_${i}_1.jpg`, `report_${i}_2.jpg`],
      description: `Potential counterfeit detected. Token appears to have been previously validated.`,
      status: status,
      reward_amount: status === 'confirmed' ? 100 : 0,
      metadata: {
        store_name: `Store ${Math.floor(Math.random() * 1000)}`,
        store_address: `${Math.floor(Math.random() * 9999)} Main St`
      },
      created_at: createdAt,
      updated_at: status !== 'pending' ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : createdAt
    });
  }

  return reports;
};

// Test scenarios for the Vanguard Reserve example
const generateVanguardReserveScenario = () => {
  const vanguardManufacturer = manufacturers[0]; // Vanguard Distillery
  
  // Create Vanguard Reserve product
  const vanguardReserve = {
    id: uuidv4(),
    manufacturer_id: vanguardManufacturer.id,
    name: 'Vanguard Reserve',
    category: 'Whisky',
    description: 'A limited-edition premium whisky with exceptional character and depth',
    alcohol_content: 43.0,
    volume: 750,
    created_at: new Date('2024-01-15')
  };

  // Create authentic token
  const authenticTokenId = uuidv4();
  const authenticTokenHash = crypto.createHash('sha256')
    .update(`${authenticTokenId}-VG-240115-001`)
    .digest('hex');

  const authenticToken = {
    id: authenticTokenId,
    token_hash: authenticTokenHash,
    product_id: vanguardReserve.id,
    manufacturer_id: vanguardManufacturer.id,
    batch_number: 'VG-240115-001',
    production_date: new Date('2024-01-15'),
    expiry_date: new Date('2034-01-15'),
    blockchain_tx_hash: `0x${crypto.randomBytes(32).toString('hex')}`,
    status: 'active',
    validated_at: null,
    validated_location: null,
    created_at: new Date('2024-01-15')
  };

  // Create counterfeit token (same hash, but will be flagged when validated twice)
  const counterfeitTokenId = uuidv4();
  const counterfeitToken = {
    id: counterfeitTokenId,
    token_hash: authenticTokenHash, // Same hash as authentic - this is the counterfeit scenario
    product_id: vanguardReserve.id,
    manufacturer_id: vanguardManufacturer.id,
    batch_number: 'VG-240115-001',
    production_date: new Date('2024-01-15'),
    expiry_date: new Date('2034-01-15'),
    blockchain_tx_hash: `0x${crypto.randomBytes(32).toString('hex')}`,
    status: 'validated', // This one was already validated - making the second one counterfeit
    validated_at: new Date('2024-08-01'),
    validated_location: 'POINT(-74.0060 40.7128)', // New York
    created_at: new Date('2024-01-15')
  };

  return {
    product: vanguardReserve,
    authenticToken,
    counterfeitToken,
    testTokenHash: authenticTokenHash
  };
};

module.exports = {
  manufacturers,
  generateProducts,
  generateTokens,
  generateUsers,
  generateSupplyChainEvents,
  generateCounterfeitReports,
  generateVanguardReserveScenario
};