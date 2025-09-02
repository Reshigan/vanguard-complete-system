/**
 * Vanguard Anti-Counterfeiting System - Full Year Data Generator
 * 
 * This script generates a comprehensive dataset covering a full year of:
 * - Product authentications
 * - Counterfeit detections
 * - User activities
 * - Distribution channel behaviors
 * - Suspicious patterns
 * - Geographic data
 * 
 * The generated data is designed to provide realistic patterns for ML training
 * and to demonstrate the system's capabilities.
 */

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const { program } = require('commander');
const ProgressBar = require('progress');
const fs = require('fs');
const path = require('path');
const { User, Product, AuthToken, Validation, Report, Channel, Reward } = require('../models');
const config = require('../config');

// Configuration options
program
  .option('-d, --days <days>', 'Number of days of data to generate', 365)
  .option('-u, --users <users>', 'Number of users to generate', 500)
  .option('-p, --products <products>', 'Number of products to generate', 200)
  .option('-c, --channels <channels>', 'Number of distribution channels', 50)
  .option('-t, --tokens <tokens>', 'Number of authentication tokens per product', 1000)
  .option('-f, --fraud <percentage>', 'Percentage of fraudulent activities', 15)
  .option('--seed <seed>', 'Random seed for reproducibility', 42)
  .option('--clean', 'Clean existing data before generation', false)
  .parse(process.argv);

const options = program.opts();

// Set random seed for reproducibility
faker.seed(parseInt(options.seed));

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(config.database.url, config.database.options);
    console.log('Connected to database');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
}

// Clean existing data if requested
async function cleanData() {
  if (options.clean) {
    console.log('Cleaning existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await AuthToken.deleteMany({});
    await Validation.deleteMany({});
    await Report.deleteMany({});
    await Channel.deleteMany({});
    await Reward.deleteMany({});
    console.log('Data cleaned');
  }
}

// Generate users
async function generateUsers() {
  console.log(`Generating ${options.users} users...`);
  const bar = new ProgressBar('[:bar] :current/:total :percent :etas', { 
    total: options.users,
    width: 30
  });
  
  const roles = ['admin', 'manufacturer', 'distributor', 'retailer', 'consumer'];
  const roleWeights = [1, 5, 10, 20, 64]; // 1% admin, 5% manufacturer, 10% distributor, 20% retailer, 64% consumer
  const totalWeight = roleWeights.reduce((a, b) => a + b, 0);
  
  const users = [];
  const adminUser = new User({
    email: 'admin@vanguard.local',
    password: '$2a$10$XQxBtEuPWj8wGEWdnrJ2XOzQVYZ3f/pKrYTzI.Ks7XzQR3YJQhwye', // Admin@123456
    name: 'System Administrator',
    role: 'admin',
    company: 'Vanguard Security Systems',
    location: {
      country: 'United States',
      city: 'San Francisco',
      coordinates: [37.7749, -122.4194]
    },
    phone: '+1-555-123-4567',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
  });
  users.push(adminUser);
  bar.tick();
  
  for (let i = 1; i < options.users; i++) {
    // Determine role based on weights
    let roleIndex = 0;
    let random = Math.floor(Math.random() * totalWeight);
    for (let j = 0; j < roleWeights.length; j++) {
      random -= roleWeights[j];
      if (random < 0) {
        roleIndex = j;
        break;
      }
    }
    const role = roles[roleIndex];
    
    // Create user with appropriate data for their role
    const user = new User({
      email: faker.internet.email().toLowerCase(),
      password: '$2a$10$XQxBtEuPWj8wGEWdnrJ2XOzQVYZ3f/pKrYTzI.Ks7XzQR3YJQhwye', // password123
      name: faker.person.fullName(),
      role: role,
      company: role !== 'consumer' ? faker.company.name() : undefined,
      location: {
        country: faker.location.country(),
        city: faker.location.city(),
        coordinates: [parseFloat(faker.location.latitude()), parseFloat(faker.location.longitude())]
      },
      phone: faker.phone.number(),
      points: role === 'consumer' ? Math.floor(Math.random() * 5000) : 0,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000)
    });
    users.push(user);
    bar.tick();
  }
  
  await User.insertMany(users);
  console.log('Users generated');
  return users;
}

// Generate distribution channels
async function generateChannels(users) {
  console.log(`Generating ${options.channels} distribution channels...`);
  const bar = new ProgressBar('[:bar] :current/:total :percent :etas', { 
    total: options.channels,
    width: 30
  });
  
  const manufacturers = users.filter(user => user.role === 'manufacturer');
  const distributors = users.filter(user => user.role === 'distributor');
  const retailers = users.filter(user => user.role === 'retailer');
  
  const channels = [];
  
  // Create some known problematic channels (for ML training)
  const problematicChannelCount = Math.floor(options.channels * 0.2); // 20% problematic
  
  for (let i = 0; i < options.channels; i++) {
    const isProblematic = i < problematicChannelCount;
    
    const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
    const distributor = distributors[Math.floor(Math.random() * distributors.length)];
    const retailer = retailers[Math.floor(Math.random() * retailers.length)];
    
    const channel = new Channel({
      name: `${manufacturer.company} > ${distributor.company} > ${retailer.company}`,
      manufacturer: manufacturer._id,
      distributor: distributor._id,
      retailer: retailer._id,
      riskScore: isProblematic ? 70 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 30),
      status: isProblematic ? (Math.random() > 0.5 ? 'flagged' : 'active') : 'active',
      region: retailer.location.country,
      city: retailer.location.city,
      coordinates: retailer.location.coordinates,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000)
    });
    
    channels.push(channel);
    bar.tick();
  }
  
  await Channel.insertMany(channels);
  console.log('Distribution channels generated');
  return channels;
}

// Generate products
async function generateProducts(users) {
  console.log(`Generating ${options.products} products...`);
  const bar = new ProgressBar('[:bar] :current/:total :percent :etas', { 
    total: options.products,
    width: 30
  });
  
  const manufacturers = users.filter(user => user.role === 'manufacturer');
  
  const categories = [
    'Electronics', 'Luxury Goods', 'Pharmaceuticals', 'Cosmetics', 'Apparel',
    'Footwear', 'Watches', 'Jewelry', 'Automotive Parts', 'Toys',
    'Sporting Goods', 'Food & Beverage', 'Home Appliances', 'Tools', 'Medical Devices'
  ];
  
  const products = [];
  
  for (let i = 0; i < options.products; i++) {
    const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    const product = new Product({
      name: faker.commerce.productName(),
      sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
      description: faker.commerce.productDescription(),
      category: category,
      manufacturer: manufacturer._id,
      price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000)
    });
    
    products.push(product);
    bar.tick();
  }
  
  await Product.insertMany(products);
  console.log('Products generated');
  return products;
}

// Generate authentication tokens
async function generateTokens(products, channels) {
  console.log(`Generating authentication tokens...`);
  const tokensPerProduct = options.tokens;
  const totalTokens = products.length * tokensPerProduct;
  
  const bar = new ProgressBar('[:bar] :current/:total :percent :etas', { 
    total: totalTokens,
    width: 30
  });
  
  const batchSize = 1000; // Insert in batches to avoid memory issues
  let tokenCount = 0;
  
  for (const product of products) {
    let tokens = [];
    
    for (let i = 0; i < tokensPerProduct; i++) {
      const channel = channels[Math.floor(Math.random() * channels.length)];
      
      const token = new AuthToken({
        token: `${product.sku}-${faker.string.alphanumeric(12).toUpperCase()}`,
        product: product._id,
        channel: channel._id,
        status: 'active',
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000)
      });
      
      tokens.push(token);
      tokenCount++;
      bar.tick();
      
      // Insert in batches
      if (tokens.length >= batchSize) {
        await AuthToken.insertMany(tokens);
        tokens = [];
      }
    }
    
    // Insert remaining tokens
    if (tokens.length > 0) {
      await AuthToken.insertMany(tokens);
    }
  }
  
  console.log(`${tokenCount} authentication tokens generated`);
}

// Generate validation events
async function generateValidations(users, products) {
  console.log('Generating validation events...');
  
  // Get all tokens
  const tokens = await AuthToken.find().lean();
  console.log(`Found ${tokens.length} tokens for validation events`);
  
  const consumers = users.filter(user => user.role === 'consumer');
  const validationsPerDay = Math.floor(tokens.length / options.days * 0.3); // Validate about 30% of tokens over the period
  
  const totalValidations = validationsPerDay * options.days;
  const bar = new ProgressBar('[:bar] :current/:total :percent :etas', { 
    total: totalValidations,
    width: 30
  });
  
  const batchSize = 1000; // Insert in batches to avoid memory issues
  let validations = [];
  let validationCount = 0;
  
  // Create validation patterns
  // 1. Normal validations (authentic products)
  // 2. Counterfeit detections (based on fraud percentage)
  // 3. Suspicious patterns (multiple validations in short time, unusual locations)
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - options.days);
  
  for (let day = 0; day < options.days; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);
    
    // Adjust validation count based on day of week (more on weekends)
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dailyValidations = isWeekend ? 
      Math.floor(validationsPerDay * 1.3) : 
      validationsPerDay;
    
    for (let i = 0; i < dailyValidations; i++) {
      const consumer = consumers[Math.floor(Math.random() * consumers.length)];
      const tokenIndex = Math.floor(Math.random() * tokens.length);
      const token = tokens[tokenIndex];
      
      // Determine if this is a fraudulent validation
      const isFraudulent = Math.random() * 100 < options.fraud;
      
      // For fraudulent validations, don't use a real token
      const validationToken = isFraudulent ? 
        `FAKE-${faker.string.alphanumeric(16).toUpperCase()}` : 
        token.token;
      
      // Set time of day (more validations during business hours)
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);
      currentDate.setHours(hour, minute, second);
      
      const validation = new Validation({
        token: validationToken,
        user: consumer._id,
        product: isFraudulent ? null : token.product,
        result: isFraudulent ? 'counterfeit' : 'authentic',
        location: {
          country: consumer.location.country,
          city: consumer.location.city,
          coordinates: consumer.location.coordinates
        },
        deviceInfo: {
          type: Math.random() > 0.7 ? 'desktop' : 'mobile',
          browser: ['Chrome', 'Safari', 'Firefox', 'Edge'][Math.floor(Math.random() * 4)],
          os: ['iOS', 'Android', 'Windows', 'macOS'][Math.floor(Math.random() * 4)]
        },
        createdAt: new Date(currentDate)
      });
      
      validations.push(validation);
      validationCount++;
      bar.tick();
      
      // Insert in batches
      if (validations.length >= batchSize) {
        await Validation.insertMany(validations);
        validations = [];
      }
    }
  }
  
  // Insert remaining validations
  if (validations.length > 0) {
    await Validation.insertMany(validations);
  }
  
  console.log(`${validationCount} validation events generated`);
}

// Generate counterfeit reports
async function generateReports(users) {
  console.log('Generating counterfeit reports...');
  
  // Get counterfeit validations
  const counterfeitValidations = await Validation.find({ result: 'counterfeit' }).lean();
  console.log(`Found ${counterfeitValidations.length} counterfeit validations for reports`);
  
  // About 30% of counterfeit validations result in reports
  const reportCount = Math.floor(counterfeitValidations.length * 0.3);
  
  const bar = new ProgressBar('[:bar] :current/:total :percent :etas', { 
    total: reportCount,
    width: 30
  });
  
  const reports = [];
  const reportStatuses = ['pending', 'confirmed', 'rejected', 'investigating'];
  const reportStatusWeights = [40, 30, 20, 10]; // 40% pending, 30% confirmed, 20% rejected, 10% investigating
  const totalWeight = reportStatusWeights.reduce((a, b) => a + b, 0);
  
  // Shuffle validations to randomize which ones get reports
  const shuffledValidations = counterfeitValidations.sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < reportCount; i++) {
    const validation = shuffledValidations[i];
    
    // Determine status based on weights
    let statusIndex = 0;
    let random = Math.floor(Math.random() * totalWeight);
    for (let j = 0; j < reportStatusWeights.length; j++) {
      random -= reportStatusWeights[j];
      if (random < 0) {
        statusIndex = j;
        break;
      }
    }
    const status = reportStatuses[statusIndex];
    
    const report = new Report({
      validation: validation._id,
      user: validation.user,
      location: validation.location,
      description: faker.lorem.paragraph(),
      evidenceType: ['visual', 'packaging', 'price', 'quality', 'other'][Math.floor(Math.random() * 5)],
      status: status,
      adminNotes: status !== 'pending' ? faker.lorem.sentences(2) : '',
      createdAt: new Date(validation.createdAt.getTime() + Math.floor(Math.random() * 60) * 60 * 1000) // 0-60 minutes after validation
    });
    
    reports.push(report);
    bar.tick();
  }
  
  await Report.insertMany(reports);
  console.log(`${reports.length} counterfeit reports generated`);
}

// Generate rewards
async function generateRewards(users) {
  console.log('Generating user rewards...');
  
  const consumers = users.filter(user => user.role === 'consumer');
  
  // Get validations and reports for reward calculation
  const validations = await Validation.find().lean();
  const reports = await Report.find().lean();
  
  const bar = new ProgressBar('[:bar] :current/:total :percent :etas', { 
    total: consumers.length,
    width: 30
  });
  
  const rewards = [];
  const rewardTypes = ['verification', 'report', 'streak', 'referral', 'signup'];
  
  for (const consumer of consumers) {
    // Count user's validations
    const userValidations = validations.filter(v => v.user.toString() === consumer._id.toString());
    
    // Count user's reports
    const userReports = reports.filter(r => r.user.toString() === consumer._id.toString());
    
    // Generate rewards based on activity
    const rewardCount = userValidations.length + userReports.length;
    
    if (rewardCount > 0) {
      // Generate some rewards for this user
      const userRewardCount = Math.min(Math.floor(rewardCount * 0.5), 50); // Cap at 50 rewards per user
      
      for (let i = 0; i < userRewardCount; i++) {
        const rewardType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
        let points = 0;
        
        switch (rewardType) {
          case 'verification':
            points = 10;
            break;
          case 'report':
            points = 50;
            break;
          case 'streak':
            points = 25;
            break;
          case 'referral':
            points = 100;
            break;
          case 'signup':
            points = 50;
            break;
        }
        
        // Random date within the past year, but after user creation
        const minDate = new Date(consumer.createdAt);
        const maxDate = new Date();
        const rewardDate = new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
        
        const reward = new Reward({
          user: consumer._id,
          type: rewardType,
          points: points,
          description: `Earned ${points} points for ${rewardType}`,
          createdAt: rewardDate
        });
        
        rewards.push(reward);
      }
    }
    
    bar.tick();
  }
  
  await Reward.insertMany(rewards);
  console.log(`${rewards.length} rewards generated`);
  
  // Update user point totals
  console.log('Updating user point totals...');
  
  for (const consumer of consumers) {
    const userRewards = rewards.filter(r => r.user.toString() === consumer._id.toString());
    const totalPoints = userRewards.reduce((sum, reward) => sum + reward.points, 0);
    
    await User.updateOne(
      { _id: consumer._id },
      { $set: { points: totalPoints } }
    );
  }
  
  console.log('User point totals updated');
}

// Export data for ML training
async function exportMLData() {
  console.log('Exporting data for ML training...');
  
  const dataDir = path.join(__dirname, '../data/ml');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Export validation data
  const validations = await Validation.find()
    .populate('user', 'role location')
    .populate('product', 'category price')
    .lean();
  
  fs.writeFileSync(
    path.join(dataDir, 'validations.json'),
    JSON.stringify(validations, null, 2)
  );
  
  // Export channel data
  const channels = await Channel.find().lean();
  
  fs.writeFileSync(
    path.join(dataDir, 'channels.json'),
    JSON.stringify(channels, null, 2)
  );
  
  // Export report data
  const reports = await Report.find().lean();
  
  fs.writeFileSync(
    path.join(dataDir, 'reports.json'),
    JSON.stringify(reports, null, 2)
  );
  
  console.log('ML training data exported');
}

// Main function
async function main() {
  try {
    console.log('Starting data generation...');
    console.log(`Configuration: ${options.days} days, ${options.users} users, ${options.products} products, ${options.fraud}% fraud`);
    
    await connectDB();
    await cleanData();
    
    const users = await generateUsers();
    const channels = await generateChannels(users);
    const products = await generateProducts(users);
    await generateTokens(products, channels);
    await generateValidations(users, products);
    await generateReports(users);
    await generateRewards(users);
    await exportMLData();
    
    console.log('Data generation complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error during data generation:', err);
    process.exit(1);
  }
}

main();