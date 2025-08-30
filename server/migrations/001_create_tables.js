exports.up = function(knex) {
  return knex.schema
    // Manufacturers table
    .createTable('manufacturers', table => {
      table.uuid('id').primary();
      table.string('name').notNullable();
      table.string('country').notNullable();
      table.string('registration_number').unique().notNullable();
      table.json('contact_info');
      table.string('blockchain_address');
      table.timestamps(true, true);
      
      table.index(['country']);
      table.index(['registration_number']);
    })
    
    // Products table
    .createTable('products', table => {
      table.uuid('id').primary();
      table.uuid('manufacturer_id').references('id').inTable('manufacturers').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('category').notNullable();
      table.text('description');
      table.decimal('alcohol_content', 4, 2);
      table.integer('volume'); // in ml
      table.timestamps(true, true);
      
      table.index(['manufacturer_id']);
      table.index(['category']);
      table.index(['name']);
    })
    
    // Users table
    .createTable('users', table => {
      table.uuid('id').primary();
      table.string('email').unique().notNullable();
      table.string('password').notNullable();
      table.string('phone');
      table.enu('role', ['consumer', 'manufacturer', 'distributor', 'admin']).notNullable();
      table.json('profile');
      table.decimal('rewards_balance', 10, 2).defaultTo(0);
      table.timestamps(true, true);
      
      table.index(['email']);
      table.index(['role']);
    })
    
    // NFC Tokens table
    .createTable('nfc_tokens', table => {
      table.uuid('id').primary();
      table.string('token_hash').unique().notNullable();
      table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE');
      table.uuid('manufacturer_id').references('id').inTable('manufacturers').onDelete('CASCADE');
      table.string('batch_number').notNullable();
      table.date('production_date');
      table.date('expiry_date');
      table.string('blockchain_tx_hash');
      table.enu('status', ['active', 'validated', 'invalidated', 'reported']).defaultTo('active');
      table.timestamp('validated_at');
      table.specificType('validated_location', 'POINT');
      table.timestamps(true, true);
      
      table.index(['token_hash']);
      table.index(['product_id']);
      table.index(['manufacturer_id']);
      table.index(['batch_number']);
      table.index(['status']);
    })
    
    // Supply Chain Events table
    .createTable('supply_chain_events', table => {
      table.uuid('id').primary();
      table.uuid('token_id').references('id').inTable('nfc_tokens').onDelete('CASCADE');
      table.enu('event_type', ['production', 'distribution', 'retail', 'validation', 'counterfeit_report', 'validation_attempt', 'report_status_update']).notNullable();
      table.uuid('stakeholder_id').references('id').inTable('users').onDelete('SET NULL');
      table.enu('stakeholder_type', ['manufacturer', 'distributor', 'retailer', 'consumer', 'admin']).notNullable();
      table.specificType('location', 'POINT');
      table.json('metadata');
      table.timestamp('timestamp').defaultTo(knex.fn.now());
      
      table.index(['token_id']);
      table.index(['event_type']);
      table.index(['stakeholder_id']);
      table.index(['timestamp']);
    })
    
    // Counterfeit Reports table
    .createTable('counterfeit_reports', table => {
      table.uuid('id').primary();
      table.uuid('token_id').references('id').inTable('nfc_tokens').onDelete('CASCADE');
      table.uuid('reporter_id').references('id').inTable('users').onDelete('SET NULL');
      table.specificType('location', 'POINT');
      table.specificType('photos', 'TEXT[]');
      table.text('description');
      table.enu('status', ['pending', 'investigating', 'confirmed', 'false_positive']).defaultTo('pending');
      table.decimal('reward_amount', 10, 2).defaultTo(0);
      table.text('notes');
      table.json('metadata');
      table.timestamps(true, true);
      
      table.index(['token_id']);
      table.index(['reporter_id']);
      table.index(['status']);
      table.index(['created_at']);
    })
    
    // Refresh Tokens table
    .createTable('refresh_tokens', table => {
      table.uuid('id').primary();
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.text('token').notNullable();
      table.timestamp('expires_at').notNullable();
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['token']);
      table.index(['expires_at']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('refresh_tokens')
    .dropTableIfExists('counterfeit_reports')
    .dropTableIfExists('supply_chain_events')
    .dropTableIfExists('nfc_tokens')
    .dropTableIfExists('products')
    .dropTableIfExists('users')
    .dropTableIfExists('manufacturers');
};