// test-db.js
const db = require('./db');

async function testConnection() {
  try {
    const [rows] = await db.query('SELECT NOW() AS time');
    console.log('✅ Connected! Current time from DB:', rows[0].time);
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
  }
}

testConnection();
