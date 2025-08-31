exports.up = function(knex) {
  return knex.schema
    // ML Model Metadata
    .createTable('ml_models', table => {
      table.uuid('id').primary();
      table.string('model_name').notNullable();
      table.string('model_type').notNullable(); // 'anomaly_detection', 'classification', 'prediction'
      table.string('version').notNullable();
      table.json('parameters');
      table.json('metrics'); // accuracy, precision, recall, etc.
      table.boolean('is_active').defaultTo(false);
      table.timestamp('trained_at');
      table.timestamps(true, true);
      
      table.index(['model_type']);
      table.index(['is_active']);
    })
    
    // Suspicious Patterns Detection
    .createTable('suspicious_patterns', table => {
      table.uuid('id').primary();
      table.string('pattern_type').notNullable(); // 'repeat_offender', 'suspicious_channel', 'velocity_anomaly', 'geographic_anomaly'
      table.uuid('entity_id'); // user_id, manufacturer_id, or token_id
      table.string('entity_type'); // 'user', 'manufacturer', 'token', 'location'
      table.decimal('risk_score', 3, 2); // 0.00 to 1.00
      table.json('pattern_data');
      table.json('ml_predictions');
      table.boolean('is_confirmed').defaultTo(false);
      table.timestamp('detected_at').defaultTo(knex.fn.now());
      table.timestamps(true, true);
      
      table.index(['pattern_type']);
      table.index(['entity_id', 'entity_type']);
      table.index(['risk_score']);
      table.index(['detected_at']);
    })
    
    // Channel Analysis
    .createTable('distribution_channels', table => {
      table.uuid('id').primary();
      table.string('channel_name').notNullable();
      table.string('channel_type'); // 'retail', 'online', 'wholesale', 'direct'
      table.specificType('location', 'POINT');
      table.string('address');
      table.string('country');
      table.decimal('trust_score', 3, 2).defaultTo(0.5); // 0.00 to 1.00
      table.integer('total_validations').defaultTo(0);
      table.integer('counterfeit_reports').defaultTo(0);
      table.decimal('counterfeit_rate', 5, 2).defaultTo(0); // percentage
      table.json('risk_factors');
      table.json('ml_analysis');
      table.timestamps(true, true);
      
      table.index(['channel_type']);
      table.index(['trust_score']);
      table.index(['counterfeit_rate']);
    })
    
    // Consumer Rewards and Gamification
    .createTable('rewards_catalog', table => {
      table.uuid('id').primary();
      table.string('reward_name').notNullable();
      table.string('reward_type'); // 'gift', 'discount', 'badge', 'experience'
      table.text('description');
      table.integer('points_required').notNullable();
      table.integer('quantity_available');
      table.string('image_url');
      table.json('terms_conditions');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('valid_from');
      table.timestamp('valid_until');
      table.timestamps(true, true);
      
      table.index(['reward_type']);
      table.index(['points_required']);
      table.index(['is_active']);
    })
    
    .createTable('user_rewards', table => {
      table.uuid('id').primary();
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('reward_id').references('id').inTable('rewards_catalog').onDelete('CASCADE');
      table.integer('points_spent').notNullable();
      table.string('status').defaultTo('pending'); // 'pending', 'claimed', 'expired'
      table.json('redemption_details');
      table.timestamp('claimed_at');
      table.timestamp('expires_at');
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['reward_id']);
      table.index(['status']);
    })
    
    .createTable('user_achievements', table => {
      table.uuid('id').primary();
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('achievement_type'); // 'first_scan', 'counterfeit_hunter', 'loyal_customer', etc.
      table.string('achievement_level'); // 'bronze', 'silver', 'gold', 'platinum'
      table.integer('progress').defaultTo(0);
      table.integer('target').notNullable();
      table.json('metadata');
      table.timestamp('achieved_at');
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['achievement_type']);
      table.index(['achieved_at']);
    })
    
    // Customer Complaints
    .createTable('customer_complaints', table => {
      table.uuid('id').primary();
      table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
      table.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
      table.uuid('manufacturer_id').references('id').inTable('manufacturers').onDelete('SET NULL');
      table.string('complaint_type'); // 'quality', 'authenticity', 'packaging', 'service'
      table.text('description').notNullable();
      table.specificType('photos', 'TEXT[]');
      table.string('status').defaultTo('open'); // 'open', 'investigating', 'resolved', 'closed'
      table.string('priority'); // 'low', 'medium', 'high', 'critical'
      table.json('resolution_details');
      table.decimal('sentiment_score', 3, 2); // -1.00 to 1.00 (ML-based)
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['manufacturer_id']);
      table.index(['status']);
      table.index(['priority']);
      table.index(['complaint_type']);
    })
    
    // AI Chat Sessions
    .createTable('ai_chat_sessions', table => {
      table.uuid('id').primary();
      table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
      table.string('session_type'); // 'support', 'analytics', 'investigation'
      table.json('conversation_history');
      table.json('extracted_insights');
      table.json('action_items');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['session_type']);
      table.index(['is_active']);
    })
    
    // Analytics Aggregations
    .createTable('analytics_daily', table => {
      table.uuid('id').primary();
      table.date('date').notNullable();
      table.uuid('manufacturer_id').references('id').inTable('manufacturers').onDelete('CASCADE');
      table.integer('total_validations').defaultTo(0);
      table.integer('unique_users').defaultTo(0);
      table.integer('counterfeit_reports').defaultTo(0);
      table.integer('complaints_received').defaultTo(0);
      table.decimal('average_trust_score', 3, 2);
      table.json('top_products');
      table.json('geographic_distribution');
      table.json('channel_performance');
      table.timestamps(true, true);
      
      table.unique(['date', 'manufacturer_id']);
      table.index(['date']);
      table.index(['manufacturer_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('analytics_daily')
    .dropTableIfExists('ai_chat_sessions')
    .dropTableIfExists('customer_complaints')
    .dropTableIfExists('user_achievements')
    .dropTableIfExists('user_rewards')
    .dropTableIfExists('rewards_catalog')
    .dropTableIfExists('distribution_channels')
    .dropTableIfExists('suspicious_patterns')
    .dropTableIfExists('ml_models');
};