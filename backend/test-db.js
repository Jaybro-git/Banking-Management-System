require('dotenv').config();
const { testConnection } = require('./config/database');

console.log('🧪 Testing database connection...');
console.log('Environment loaded:', process.env.DATABASE_URL ? 'YES' : 'NO');

// Test the connection
async function runTest() {
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('🎉 Database test completed successfully!');
    process.exit(0);
  } else {
    console.log('💥 Database test failed!');
    process.exit(1);
  }
}

runTest();