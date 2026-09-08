const { Pool } = require('pg');

// DATABASE_URL example for local dev:
// postgresql://postgres:yourpassword@localhost:5432/crisis_radar
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
  process.exit(1);
});

module.exports = pool;
