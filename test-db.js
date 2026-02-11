const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
    await client.connect();
    console.log('Connected successfully!');
    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0]);
    await client.end();
  } catch (error) {
    console.error('Connection error:', error.message);
  }
}

testConnection();
