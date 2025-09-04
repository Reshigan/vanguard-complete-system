exports.up = function(knex) {
  return knex.schema
    // ML Model Training Data
    .createTable('ml_training_data', table => {
      table.uuid('id').primary();
      table.uuid('token_id').references('id').inTable('nfc_tokens');
      table.json('features'); // Product features, location, time patterns
      table.boolean('is_counterfeit').defaultTo(false);
      table.decimal('confidence_score', 5, 4);
      table.timestamp('detected_at');
      table.json('detection_metadata');
      table.timestamps(true, true);
      
      table.index(['token_id']);
      table.index(['is_counterfeit']);
      table.index(['detected_at']);
    })
    
    // AI Chat Sessions
    .createTable('ai_chat_sessions', table => {
      table.uuid('id').primary();
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.json('messages'); // Array of {role, content, timestamp}
      table.string('intent'); // detected intent: verify, report, track, etc.
      table.json('entities'); // extracted entities
      table.string('resolution_status');
      table.uuid('related_token_id').references('id').inTable('nfc_tokens');
      table.uuid('related_report_id').references('id').inTable('counterfeit_reports');
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['intent']);
      table.index(['created_at']);
    })
    
    // Consumer Rewards
    .createTable('rewards_transactions', table => {
      table.uuid('id').primary();
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.enu('type', ['earned', 'redeemed', 'expired', 'bonus']).notNullable();
      table.decimal('amount', 10, 2).notNullable();
      table.string('reason').notNullable();
      table.uuid('related_report_id').references('id').inTable('counterfeit_reports');
      table.uuid('related_validation_id').references('id').inTable('supply_chain_events');
      table.json('metadata');
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['type']);
      table.index(['created_at']);
    })
    
    // Rewards Catalog
    .createTable('rewards_catalog', table => {
      table.uuid('id').primary();
      table.string('name').notNullable();
      table.text('description');
      table.decimal('points_required', 10, 2).notNullable();
      table.string('category'); // gift, discount, experience
      table.string('partner_name');
      table.json('terms_conditions');
      table.boolean('is_active').defaultTo(true);
      table.integer('stock_quantity');
      table.string('image_url');
      table.timestamps(true, true);
      
      table.index(['category']);
      table.index(['is_active']);
      table.index(['points_required']);
    })
    
    // Rewards Redemptions
    .createTable('rewards_redemptions', table => {
      table.uuid('id').primary();
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('reward_id').references('id').inTable('rewards_catalog');
      table.uuid('transaction_id').references('id').inTable('rewards_transactions');
      table.string('redemption_code').unique();
      table.enu('status', ['pending', 'approved', 'delivered', 'cancelled']).defaultTo('pending');
      table.json('delivery_details');
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['reward_id']);
      table.index(['status']);
      table.index(['redemption_code']);
    })
    
    // Channel Analytics
    .createTable('channel_analytics', table => {
      table.uuid('id').primary();
      table.uuid('manufacturer_id').references('id').inTable('manufacturers');
      table.string('channel_type'); // retail, online, distributor
      table.string('channel_name');
      table.string('region');
      table.integer('total_sales').defaultTo(0);
      table.integer('counterfeit_incidents').defaultTo(0);
      table.decimal('trust_score', 5, 4).defaultTo(1.0);
      table.json('performance_metrics');
      table.date('analysis_date');
      table.timestamps(true, true);
      
      table.index(['manufacturer_id']);
      table.index(['channel_type']);
      table.index(['trust_score']);
      table.index(['analysis_date']);
    })
    
    // Customer Complaints
    .createTable('customer_complaints', table => {
      table.uuid('id').primary();
      table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
      table.uuid('product_id').references('id').inTable('products');
      table.uuid('manufacturer_id').references('id').inTable('manufacturers');
      table.uuid('token_id').references('id').inTable('nfc_tokens');
      table.enu('category', ['quality', 'authenticity', 'packaging', 'taste', 'other']).notNullable();
      table.text('description').notNullable();
      table.enu('severity', ['low', 'medium', 'high', 'critical']).defaultTo('medium');
      table.enu('status', ['open', 'investigating', 'resolved', 'closed']).defaultTo('open');
      table.text('resolution');
      table.json('attachments');
      table.timestamps(true, true);
      
      table.index(['manufacturer_id']);
      table.index(['product_id']);
      table.index(['category']);
      table.index(['status']);
      table.index(['created_at']);
    })
    
    // Fraud Detection Patterns
    .createTable('fraud_patterns', table => {
      table.uuid('id').primary();
      table.string('pattern_name').notNullable();
      table.json('pattern_rules'); // ML model parameters
      table.decimal('accuracy_score', 5, 4);
      table.integer('detections_count').defaultTo(0);
      table.json('geographic_hotspots');
      table.json('time_patterns');
      table.json('product_categories');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      table.index(['pattern_name']);
      table.index(['is_active']);
      table.index(['accuracy_score']);
    })
    
    // Repeat Offenders
    .createTable('repeat_offenders', table => {
      table.uuid('id').primary();
      table.string('identifier_type'); // ip, device_id, location, pattern
      table.string('identifier_value');
      table.integer('offense_count').defaultTo(1);
      table.json('offense_history');
      table.decimal('risk_score', 5, 4);
      table.json('associated_tokens');
      table.json('behavioral_patterns');
      table.boolean('is_blocked').defaultTo(false);
      table.timestamps(true, true);
      
      table.index(['identifier_type', 'identifier_value']);
      table.index(['risk_score']);
      table.index(['is_blocked']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('repeat_offenders')
    .dropTableIfExists('fraud_patterns')
    .dropTableIfExists('customer_complaints')
    .dropTableIfExists('channel_analytics')
    .dropTableIfExists('rewards_redemptions')
    .dropTableIfExists('rewards_catalog')
    .dropTableIfExists('rewards_transactions')
    .dropTableIfExists('ai_chat_sessions')
    .dropTableIfExists('ml_training_data');
};