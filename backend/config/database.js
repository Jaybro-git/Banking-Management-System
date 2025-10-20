const { Pool } = require('pg');
require('dotenv').config();

//console.log('🔗 Attempting to connect to database...');


//console.log('Database URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection function
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database successfully!');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('📅 Database time:', result.rows[0].now);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Test connection immediately
//testConnection();

module.exports = {
  pool,
  testConnection
};