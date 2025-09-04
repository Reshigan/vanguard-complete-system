const knex = require('../config/database')
const fs = require('fs')
const path = require('path')

async function runSouthAfricaMigration() {
  console.log('🇿🇦 Running South African Alcohol Data Migration...')
  
  try {
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '../migrations/004_south_africa_alcohol_data.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolons but be careful with functions/procedures
    const statements = migrationSQL
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';')
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === ';') {
        continue
      }
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        await knex.raw(statement)
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error.message)
        // Continue with other statements
      }
    }
    
    // Get summary statistics
    const stats = await knex.raw(`
      SELECT 
        (SELECT COUNT(*) FROM manufacturers) as manufacturers,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM users WHERE role = 'retailer') as retailers,
        (SELECT COUNT(*) FROM users WHERE role = 'consumer') as consumers,
        (SELECT COUNT(*) FROM locations) as locations,
        (SELECT COUNT(*) FROM nxt_tokens) as tokens,
        (SELECT COUNT(*) FROM validations) as validations,
        (SELECT COUNT(*) FROM counterfeit_reports) as reports
    `)
    
    const result = stats.rows[0]
    
    console.log('\n✅ South African Data Migration Complete!')
    console.log('📊 Database Statistics:')
    console.log(`   - Manufacturers: ${result.manufacturers}`)
    console.log(`   - Products: ${result.products}`)
    console.log(`   - Retailers: ${result.retailers}`)
    console.log(`   - Consumers: ${result.consumers}`)
    console.log(`   - Locations: ${result.locations}`)
    console.log(`   - NXT Tokens: ${result.tokens}`)
    console.log(`   - Validations: ${result.validations}`)
    console.log(`   - Counterfeit Reports: ${result.reports}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await knex.destroy()
  }
}

// Run the migration
runSouthAfricaMigration()