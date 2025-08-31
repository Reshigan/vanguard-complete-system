const knex = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class DataGenerator {
  constructor() {
    this.startDate = new Date();
    this.startDate.setFullYear(this.startDate.getFullYear() - 1);
    this.endDate = new Date();
    
    // Realistic distribution parameters
    this.counterfeitRate = 0.03; // 3% counterfeit rate
    this.repeatOffenderRate = 0.15; // 15% of counterfeiters are repeat offenders
    this.channelRiskDistribution = {
      high_risk: 0.1,
      medium_risk: 0.3,
      low_risk: 0.6
    };
  }

  async generateFullYearData() {
    try {
      logger.info('Starting full year data generation...');
      
      // Clear existing data (optional - comment out to append)
      await this.clearExistingData();
      
      // Generate base data
      const manufacturers = await this.generateManufacturers();
      const products = await this.generateProducts(manufacturers);
      const users = await this.generateUsers();
      const channels = await this.generateDistributionChannels();
      const rewards = await this.generateRewardsCatalog();
      
      // Generate time-series data
      await this.generateYearlyTokensAndEvents(products, users, channels);
      
      // Generate ML training data
      await this.generateMLPatterns(users, channels);
      
      // Generate analytics aggregations
      await this.generateAnalyticsData(manufacturers);
      
      logger.info('Data generation completed successfully!');
      
      return {
        manufacturers: manufacturers.length,
        products: products.length,
        users: users.length,
        channels: channels.length,
        rewards: rewards.length
      };
    } catch (error) {
      logger.error('Error generating data:', error);
      throw error;
    }
  }

  async clearExistingData() {
    const tables = [
      'analytics_daily',
      'ai_chat_sessions',
      'customer_complaints',
      'user_achievements',
      'user_rewards',
      'suspicious_patterns',
      'counterfeit_reports',
      'supply_chain_events',
      'nfc_tokens',
      'refresh_tokens'
    ];

    for (const table of tables) {
      await knex(table).del();
    }
  }

  async generateManufacturers() {
    const manufacturers = [
      { name: 'Vanguard Distillery', country: 'Scotland', category: 'Premium Spirits' },
      { name: 'Château Excellence', country: 'France', category: 'Fine Wines' },
      { name: 'Sakura Brewery', country: 'Japan', category: 'Sake & Spirits' },
      { name: 'Alpine Spirits AG', country: 'Switzerland', category: 'Premium Liqueurs' },
      { name: 'Tequila Auténtico', country: 'Mexico', category: 'Tequila' },
      { name: 'Vodka Kristall', country: 'Russia', category: 'Vodka' },
      { name: 'Bourbon Heritage', country: 'USA', category: 'Whiskey' },
      { name: 'Porto Vintage', country: 'Portugal', category: 'Port Wine' },
      { name: 'Grappa Italiana', country: 'Italy', category: 'Grappa' },
      { name: 'Caribbean Rum Co', country: 'Jamaica', category: 'Rum' }
    ];

    const insertedManufacturers = [];
    
    for (const mfg of manufacturers) {
      const id = uuidv4();
      await knex('manufacturers').insert({
        id,
        name: mfg.name,
        country: mfg.country,
        registration_number: `REG-${mfg.country}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        contact_info: JSON.stringify({
          email: `contact@${mfg.name.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: `+${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
          address: `${Math.floor(Math.random() * 999 + 1)} Industry Blvd, ${mfg.country}`
        }),
        blockchain_address: `0x${Math.random().toString(16).substr(2, 40)}`
      });
      
      insertedManufacturers.push({ id, ...mfg });
    }
    
    return insertedManufacturers;
  }

  async generateProducts(manufacturers) {
    const productTemplates = {
      'Premium Spirits': [
        { name: 'Reserve 25 Year', alcohol: 45.0, volume: 750 },
        { name: 'Single Malt Excellence', alcohol: 43.0, volume: 700 },
        { name: 'Limited Edition', alcohol: 48.0, volume: 750 },
        { name: 'Cask Strength', alcohol: 58.0, volume: 700 }
      ],
      'Fine Wines': [
        { name: 'Grand Cru 2015', alcohol: 13.5, volume: 750 },
        { name: 'Premier Reserve', alcohol: 14.0, volume: 750 },
        { name: 'Vintage Collection', alcohol: 12.5, volume: 750 }
      ],
      'Sake & Spirits': [
        { name: 'Daiginjo Premium', alcohol: 16.0, volume: 720 },
        { name: 'Junmai Gold', alcohol: 15.0, volume: 720 },
        { name: 'Shochu Reserve', alcohol: 25.0, volume: 700 }
      ]
    };

    const products = [];
    
    for (const mfg of manufacturers) {
      const templates = productTemplates[mfg.category] || productTemplates['Premium Spirits'];
      
      for (const template of templates) {
        const id = uuidv4();
        await knex('products').insert({
          id,
          manufacturer_id: mfg.id,
          name: `${mfg.name} ${template.name}`,
          category: mfg.category,
          description: `Premium ${template.name} from ${mfg.name}, crafted with excellence`,
          alcohol_content: template.alcohol,
          volume: template.volume
        });
        
        products.push({ id, manufacturer_id: mfg.id, ...template });
      }
    }
    
    return products;
  }

  async generateUsers() {
    const users = [];
    const roles = ['consumer', 'manufacturer', 'distributor'];
    const countries = ['USA', 'UK', 'France', 'Germany', 'Japan', 'Canada', 'Australia', 'Brazil', 'India', 'China'];
    
    // Generate diverse user base
    for (let i = 0; i < 500; i++) {
      const role = i < 400 ? 'consumer' : roles[Math.floor(Math.random() * roles.length)];
      const country = countries[Math.floor(Math.random() * countries.length)];
      const id = uuidv4();
      
      await knex('users').insert({
        id,
        email: `user${i}@${role}.com`,
        password: await bcrypt.hash('password123', 10),
        phone: `+1-555-${String(Math.floor(Math.random() * 900 + 100))}-${String(Math.floor(Math.random() * 9000 + 1000))}`,
        role,
        profile: JSON.stringify({
          firstName: `User${i}`,
          lastName: role.charAt(0).toUpperCase() + role.slice(1),
          country,
          joinDate: new Date(this.startDate.getTime() + Math.random() * (this.endDate - this.startDate))
        }),
        rewards_balance: role === 'consumer' ? Math.floor(Math.random() * 5000) : 0
      });
      
      users.push({ id, email: `user${i}@${role}.com`, role, country });
    }
    
    return users;
  }

  async generateDistributionChannels() {
    const channels = [];
    const channelTypes = ['retail', 'online', 'wholesale', 'direct'];
    const cities = [
      { name: 'New York', lat: 40.7128, lng: -74.0060, country: 'USA' },
      { name: 'London', lat: 51.5074, lng: -0.1278, country: 'UK' },
      { name: 'Paris', lat: 48.8566, lng: 2.3522, country: 'France' },
      { name: 'Tokyo', lat: 35.6762, lng: 139.6503, country: 'Japan' },
      { name: 'Sydney', lat: -33.8688, lng: 151.2093, country: 'Australia' },
      { name: 'Mumbai', lat: 19.0760, lng: 72.8777, country: 'India' },
      { name: 'São Paulo', lat: -23.5505, lng: -46.6333, country: 'Brazil' },
      { name: 'Toronto', lat: 43.6532, lng: -79.3832, country: 'Canada' },
      { name: 'Berlin', lat: 52.5200, lng: 13.4050, country: 'Germany' },
      { name: 'Mexico City', lat: 19.4326, lng: -99.1332, country: 'Mexico' }
    ];
    
    for (let i = 0; i < 200; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const channelType = channelTypes[Math.floor(Math.random() * channelTypes.length)];
      const id = uuidv4();
      
      // Assign risk based on distribution
      let trustScore;
      const rand = Math.random();
      if (rand < this.channelRiskDistribution.high_risk) {
        trustScore = 0.1 + Math.random() * 0.2; // 0.1-0.3
      } else if (rand < this.channelRiskDistribution.high_risk + this.channelRiskDistribution.medium_risk) {
        trustScore = 0.3 + Math.random() * 0.4; // 0.3-0.7
      } else {
        trustScore = 0.7 + Math.random() * 0.3; // 0.7-1.0
      }
      
      await knex('distribution_channels').insert({
        id,
        channel_name: `${city.name} ${channelType.charAt(0).toUpperCase() + channelType.slice(1)} Store ${i}`,
        channel_type: channelType,
        location: knex.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [city.lng, city.lat + (Math.random() - 0.5) * 0.1]),
        address: `${Math.floor(Math.random() * 999 + 1)} Commerce St, ${city.name}`,
        country: city.country,
        trust_score: trustScore
      });
      
      channels.push({ id, city: city.name, channelType, trustScore });
    }
    
    return channels;
  }

  async generateRewardsCatalog() {
    const rewards = [
      { name: 'Bronze Badge', type: 'badge', points: 100, description: 'First validation milestone' },
      { name: 'Silver Badge', type: 'badge', points: 500, description: 'Experienced validator' },
      { name: 'Gold Badge', type: 'badge', points: 1000, description: 'Expert validator' },
      { name: 'Platinum Badge', type: 'badge', points: 5000, description: 'Master validator' },
      { name: '$10 Gift Card', type: 'gift', points: 1000, description: 'Redeemable at partner stores' },
      { name: '$25 Gift Card', type: 'gift', points: 2500, description: 'Redeemable at partner stores' },
      { name: '$50 Gift Card', type: 'gift', points: 5000, description: 'Redeemable at partner stores' },
      { name: '10% Discount Coupon', type: 'discount', points: 500, description: 'Valid on next purchase' },
      { name: '20% Discount Coupon', type: 'discount', points: 1000, description: 'Valid on next purchase' },
      { name: 'Free Shipping', type: 'discount', points: 300, description: 'One-time free shipping' },
      { name: 'VIP Tasting Experience', type: 'experience', points: 10000, description: 'Exclusive distillery tour' },
      { name: 'Limited Edition Bottle', type: 'gift', points: 15000, description: 'Exclusive collector item' },
      { name: 'Counterfeit Hunter Trophy', type: 'badge', points: 2000, description: 'For reporting 10+ counterfeits' },
      { name: 'Brand Ambassador Status', type: 'experience', points: 20000, description: '1-year brand ambassador' }
    ];
    
    const insertedRewards = [];
    
    for (const reward of rewards) {
      const id = uuidv4();
      await knex('rewards_catalog').insert({
        id,
        reward_name: reward.name,
        reward_type: reward.type,
        description: reward.description,
        points_required: reward.points,
        quantity_available: reward.type === 'badge' ? null : Math.floor(Math.random() * 100 + 50),
        image_url: `/images/rewards/${reward.type}/${reward.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        terms_conditions: JSON.stringify({
          validity: '6 months from redemption',
          restrictions: 'Non-transferable, subject to availability'
        }),
        is_active: true,
        valid_from: this.startDate,
        valid_until: new Date(this.endDate.getTime() + 180 * 24 * 60 * 60 * 1000) // +6 months
      });
      
      insertedRewards.push({ id, ...reward });
    }
    
    return insertedRewards;
  }

  async generateYearlyTokensAndEvents(products, users, channels) {
    const consumers = users.filter(u => u.role === 'consumer');
    const totalDays = Math.floor((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
    
    // Generate patterns over time
    for (let day = 0; day < totalDays; day++) {
      const currentDate = new Date(this.startDate.getTime() + day * 24 * 60 * 60 * 1000);
      
      // Seasonal variations
      const month = currentDate.getMonth();
      const isHolidaySeason = month === 11 || month === 0; // December, January
      const dailyVolume = isHolidaySeason ? 100 + Math.floor(Math.random() * 100) : 50 + Math.floor(Math.random() * 50);
      
      // Generate daily tokens and validations
      for (let i = 0; i < dailyVolume; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const channel = channels[Math.floor(Math.random() * channels.length)];
        const consumer = consumers[Math.floor(Math.random() * consumers.length)];
        
        // Create token
        const tokenId = uuidv4();
        const tokenHash = `NFC-${currentDate.getFullYear()}-${String(day).padStart(3, '0')}-${String(i).padStart(4, '0')}`;
        
        await knex('nfc_tokens').insert({
          id: tokenId,
          token_hash: tokenHash,
          product_id: product.id,
          manufacturer_id: product.manufacturer_id,
          batch_number: `BATCH-${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
          production_date: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days before
          expiry_date: new Date(currentDate.getTime() + 730 * 24 * 60 * 60 * 1000), // 2 years later
          status: 'active',
          created_at: currentDate
        });
        
        // Production event
        await knex('supply_chain_events').insert({
          id: uuidv4(),
          token_id: tokenId,
          event_type: 'production',
          stakeholder_id: users.find(u => u.role === 'manufacturer')?.id,
          stakeholder_type: 'manufacturer',
          location: knex.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [
            channel.city === 'New York' ? -74.0060 : -0.1278,
            channel.city === 'New York' ? 40.7128 : 51.5074
          ]),
          metadata: JSON.stringify({ batch: `BATCH-${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}` }),
          timestamp: currentDate
        });
        
        // Validation or counterfeit report
        const validationDate = new Date(currentDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000); // Within 7 days
        const isCounterfeit = Math.random() < (channel.trustScore < 0.3 ? 0.15 : this.counterfeitRate);
        
        if (isCounterfeit) {
          // Counterfeit scenario
          await knex('nfc_tokens').where('id', tokenId).update({
            status: 'reported',
            validated_at: validationDate
          });
          
          const reportId = uuidv4();
          await knex('counterfeit_reports').insert({
            id: reportId,
            token_id: tokenId,
            reporter_id: consumer.id,
            location: knex.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [
              -74.0060 + (Math.random() - 0.5) * 0.1,
              40.7128 + (Math.random() - 0.5) * 0.1
            ]),
            photos: JSON.stringify(['/uploads/counterfeit1.jpg', '/uploads/counterfeit2.jpg']),
            description: 'Suspicious packaging, QR code already used',
            status: Math.random() < 0.7 ? 'confirmed' : 'investigating',
            reward_amount: 50,
            created_at: validationDate
          });
          
          await knex('supply_chain_events').insert({
            id: uuidv4(),
            token_id: tokenId,
            event_type: 'counterfeit_report',
            stakeholder_id: consumer.id,
            stakeholder_type: 'consumer',
            metadata: JSON.stringify({ report_id: reportId }),
            timestamp: validationDate
          });
          
          // Update channel metrics
          await knex('distribution_channels').where('id', channel.id).increment('counterfeit_reports', 1);
        } else {
          // Valid product scenario
          await knex('nfc_tokens').where('id', tokenId).update({
            status: 'validated',
            validated_at: validationDate,
            validated_location: knex.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [
              -74.0060 + (Math.random() - 0.5) * 0.1,
              40.7128 + (Math.random() - 0.5) * 0.1
            ])
          });
          
          await knex('supply_chain_events').insert({
            id: uuidv4(),
            token_id: tokenId,
            event_type: 'validation',
            stakeholder_id: consumer.id,
            stakeholder_type: 'consumer',
            metadata: JSON.stringify({ channel_id: channel.id }),
            timestamp: validationDate
          });
          
          // Award points
          await knex('users').where('id', consumer.id).increment('rewards_balance', 10);
        }
        
        // Update channel metrics
        await knex('distribution_channels').where('id', channel.id).increment('total_validations', 1);
      }
      
      // Generate daily analytics
      for (const mfg of products.map(p => p.manufacturer_id).filter((v, i, a) => a.indexOf(v) === i)) {
        const dayStats = await this.calculateDailyStats(mfg, currentDate);
        
        await knex('analytics_daily').insert({
          id: uuidv4(),
          date: currentDate,
          manufacturer_id: mfg,
          ...dayStats
        });
      }
    }
    
    // Generate complaints
    await this.generateComplaints(products, consumers);
    
    // Generate user achievements
    await this.generateUserAchievements(consumers);
  }

  async calculateDailyStats(manufacturerId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const validations = await knex('supply_chain_events')
      .join('nfc_tokens', 'supply_chain_events.token_id', 'nfc_tokens.id')
      .where('nfc_tokens.manufacturer_id', manufacturerId)
      .whereBetween('supply_chain_events.timestamp', [startOfDay, endOfDay])
      .where('supply_chain_events.event_type', 'validation')
      .count('* as count')
      .first();
    
    const uniqueUsers = await knex('supply_chain_events')
      .join('nfc_tokens', 'supply_chain_events.token_id', 'nfc_tokens.id')
      .where('nfc_tokens.manufacturer_id', manufacturerId)
      .whereBetween('supply_chain_events.timestamp', [startOfDay, endOfDay])
      .countDistinct('supply_chain_events.stakeholder_id as count')
      .first();
    
    const counterfeits = await knex('counterfeit_reports')
      .join('nfc_tokens', 'counterfeit_reports.token_id', 'nfc_tokens.id')
      .where('nfc_tokens.manufacturer_id', manufacturerId)
      .whereBetween('counterfeit_reports.created_at', [startOfDay, endOfDay])
      .count('* as count')
      .first();
    
    return {
      total_validations: parseInt(validations.count) || 0,
      unique_users: parseInt(uniqueUsers.count) || 0,
      counterfeit_reports: parseInt(counterfeits.count) || 0,
      complaints_received: Math.floor(Math.random() * 5), // Simulated
      average_trust_score: 0.7 + Math.random() * 0.2,
      top_products: JSON.stringify([]), // Simplified
      geographic_distribution: JSON.stringify({}), // Simplified
      channel_performance: JSON.stringify({}) // Simplified
    };
  }

  async generateComplaints(products, consumers) {
    const complaintTypes = ['quality', 'authenticity', 'packaging', 'service'];
    const priorities = ['low', 'medium', 'high', 'critical'];
    const statuses = ['open', 'investigating', 'resolved', 'closed'];
    
    for (let i = 0; i < 200; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const consumer = consumers[Math.floor(Math.random() * consumers.length)];
      const complaintDate = new Date(this.startDate.getTime() + Math.random() * (this.endDate - this.startDate));
      
      await knex('customer_complaints').insert({
        id: uuidv4(),
        user_id: consumer.id,
        product_id: product.id,
        manufacturer_id: product.manufacturer_id,
        complaint_type: complaintTypes[Math.floor(Math.random() * complaintTypes.length)],
        description: 'Sample complaint description about product quality or authenticity concerns',
        photos: JSON.stringify(['/uploads/complaint1.jpg']),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        sentiment_score: -0.5 + Math.random(), // -0.5 to 0.5
        created_at: complaintDate
      });
    }
  }

  async generateUserAchievements(consumers) {
    const achievementTypes = [
      { type: 'first_scan', target: 1, level: 'bronze' },
      { type: 'counterfeit_hunter', target: 5, level: 'silver' },
      { type: 'loyal_customer', target: 50, level: 'gold' },
      { type: 'brand_champion', target: 100, level: 'platinum' }
    ];
    
    for (const consumer of consumers.slice(0, 100)) { // Top 100 active users
      for (const achievement of achievementTypes) {
        const progress = Math.floor(Math.random() * (achievement.target + 5));
        const achieved = progress >= achievement.target;
        
        await knex('user_achievements').insert({
          id: uuidv4(),
          user_id: consumer.id,
          achievement_type: achievement.type,
          achievement_level: achievement.level,
          progress: Math.min(progress, achievement.target),
          target: achievement.target,
          achieved_at: achieved ? new Date(this.startDate.getTime() + Math.random() * (this.endDate - this.startDate)) : null
        });
      }
    }
  }

  async generateMLPatterns(users, channels) {
    // Generate suspicious patterns for ML training
    const patternTypes = ['repeat_offender', 'suspicious_channel', 'velocity_anomaly', 'geographic_anomaly'];
    
    // Identify repeat offenders
    const repeatOffenders = await knex('counterfeit_reports')
      .select('reporter_id')
      .groupBy('reporter_id')
      .having(knex.raw('COUNT(*) > 3'))
      .pluck('reporter_id');
    
    for (const offenderId of repeatOffenders) {
      await knex('suspicious_patterns').insert({
        id: uuidv4(),
        pattern_type: 'repeat_offender',
        entity_id: offenderId,
        entity_type: 'user',
        risk_score: 0.7 + Math.random() * 0.3,
        pattern_data: JSON.stringify({
          report_count: Math.floor(Math.random() * 10 + 3),
          time_span_days: Math.floor(Math.random() * 180 + 30)
        }),
        ml_predictions: JSON.stringify({
          next_report_probability: 0.8,
          estimated_days_to_next: Math.floor(Math.random() * 30)
        }),
        is_confirmed: Math.random() < 0.7
      });
    }
    
    // Identify suspicious channels
    const suspiciousChannels = channels.filter(c => c.trustScore < 0.3);
    
    for (const channel of suspiciousChannels) {
      await knex('suspicious_patterns').insert({
        id: uuidv4(),
        pattern_type: 'suspicious_channel',
        entity_id: channel.id,
        entity_type: 'location',
        risk_score: 1 - channel.trustScore,
        pattern_data: JSON.stringify({
          counterfeit_rate: Math.random() * 0.3 + 0.1,
          location: channel.city,
          channel_type: channel.channelType
        }),
        ml_predictions: JSON.stringify({
          future_risk_trend: 'increasing',
          recommended_action: 'immediate_investigation'
        }),
        is_confirmed: false
      });
    }
    
    // Generate velocity anomalies
    for (let i = 0; i < 50; i++) {
      await knex('suspicious_patterns').insert({
        id: uuidv4(),
        pattern_type: 'velocity_anomaly',
        entity_id: users[Math.floor(Math.random() * users.length)].id,
        entity_type: 'user',
        risk_score: 0.5 + Math.random() * 0.5,
        pattern_data: JSON.stringify({
          validations_per_hour: Math.floor(Math.random() * 20 + 10),
          normal_rate: 2,
          deviation_factor: Math.random() * 10 + 5
        }),
        ml_predictions: JSON.stringify({
          anomaly_confidence: 0.85,
          pattern_classification: 'bulk_validation_attempt'
        }),
        is_confirmed: false
      });
    }
  }

  async generateAnalyticsData(manufacturers) {
    // Already generated in generateYearlyTokensAndEvents
    logger.info('Analytics data generated during token generation');
  }
}

module.exports = new DataGenerator();