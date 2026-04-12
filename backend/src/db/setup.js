// This script runs once to create your database tables
// Run it with: npm run db:setup
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function setup() {
  try {
    console.log('🔧 Setting up database schema...');

    const schema = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    );

    await pool.query(schema);
    console.log('✅ Database schema created successfully');
  } catch (err) {
    console.error('❌ Schema setup failed:', err.message);
  } finally {
    // Always close the pool when the script finishes
    await pool.end();
    process.exit(0);
  }
}

setup();