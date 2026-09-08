const fs = require('fs');
const pool = require('../config/db');

async function setup() {
  try {
    console.log('Setting up Crisis Radar database...');

    const schema = fs.readFileSync('src/db/schema.sql', 'utf8');
    const seed = fs.readFileSync('src/db/seed.sql', 'utf8');

    await pool.query(schema);
    console.log('Schema created successfully.');

    await pool.query(seed);
    console.log('Sample data inserted successfully.');

    console.log('Database setup complete.');
  } catch (error) {
    console.error('Database setup failed:');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

setup();