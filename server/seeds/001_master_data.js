const {
  manufacturers,
  generateProducts,
  generateTokens,
  generateUsers,
  generateSupplyChainEvents,
  generateCounterfeitReports,
  generateVanguardReserveScenario
} = require('../data/masterData');

exports.seed = async function(knex) {
  console.log('🌱 Starting master data seeding...');

  // Clear existing data in reverse dependency order
  await knex('counterfeit_reports').del();
  await knex('supply_chain_events').del();
  await knex('refresh_tokens').del();
  await knex('nfc_tokens').del();
  await knex('products').del();
  await knex('users').del();
  await knex('manufacturers').del();

  console.log('✅ Cleared existing data');

  // Insert manufacturers
  await knex('manufacturers').insert(manufacturers.map(m => ({
    ...m,
    contact_info: JSON.stringify(m.contact_info),
    created_at: new Date(),
    updated_at: new Date()
  })));
  console.log(`✅ Inserted ${manufacturers.length} manufacturers`);

  // Generate and insert products
  const products = generateProducts();
  await knex('products').insert(products);
  console.log(`✅ Inserted ${products.length} products`);

  // Generate and insert users
  const users = generateUsers();
  await knex('users').insert(users);
  console.log(`✅ Inserted ${users.length} users`);

  // Generate and insert NFC tokens
  const tokens = generateTokens(products);
  await knex('nfc_tokens').insert(tokens);
  console.log(`✅ Inserted ${tokens.length} NFC tokens`);

  // Generate and insert supply chain events
  const events = generateSupplyChainEvents(tokens, users);
  await knex('supply_chain_events').insert(events);
  console.log(`✅ Inserted ${events.length} supply chain events`);

  // Generate and insert counterfeit reports
  const reports = generateCounterfeitReports(tokens, users);
  await knex('counterfeit_reports').insert(reports);
  console.log(`✅ Inserted ${reports.length} counterfeit reports`);

  // Insert Vanguard Reserve test scenario
  const scenario = generateVanguardReserveScenario();
  
  // Insert the special product
  await knex('products').insert(scenario.product);
  console.log('✅ Inserted Vanguard Reserve test product');

  // Insert the test tokens
  await knex('nfc_tokens').insert([scenario.authenticToken, scenario.counterfeitToken]);
  console.log('✅ Inserted Vanguard Reserve test tokens');

  console.log('\n🎉 Master data seeding completed successfully!');
  console.log('\n📋 Test Data Summary:');
  console.log(`   • ${manufacturers.length} Global Manufacturers`);
  console.log(`   • ${products.length + 1} Products (including Vanguard Reserve)`);
  console.log(`   • ${users.length} Users (consumers, distributors, manufacturers)`);
  console.log(`   • ${tokens.length + 2} NFC Tokens (including test scenario)`);
  console.log(`   • ${events.length} Supply Chain Events`);
  console.log(`   • ${reports.length} Counterfeit Reports`);
  
  console.log('\n🧪 Test Scenario:');
  console.log(`   • Product: Vanguard Reserve`);
  console.log(`   • Test Token Hash: ${scenario.testTokenHash}`);
  console.log(`   • Scenario: Counterfeit detection (token already validated)`);
  
  console.log('\n👤 Test Users:');
  console.log('   • Email: admin@vanguarddistillery.com | Password: password123 | Role: manufacturer');
  console.log('   • Email: john.smith0@gmail.com | Password: password123 | Role: consumer');
  console.log('   • Email: distributor0@globaldistributors.com | Password: password123 | Role: distributor');
  
  console.log('\n🚀 Ready to test the Vanguard system!');
};