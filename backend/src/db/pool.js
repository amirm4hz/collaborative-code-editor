const { Pool } = require('pg');
require('dotenv').config();

// Pool = a group of reusable database connections
// Instead of opening a new connection for every query (slow),
// we keep a pool of connections ready to go
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Required for Railway's hosted PostgreSQL
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test the connection when the server starts
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

module.exports = pool;