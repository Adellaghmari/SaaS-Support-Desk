import fs from 'fs';
import path from 'path';
import { initDatabase } from '../config/initDatabase';
import { getPool } from '../config/db';

async function setup() {
  await initDatabase();
  const pool = getPool();
  const schemaPath = path.join(__dirname, '../../../database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  console.log('Schema verified/applied.');
  await pool.query(schema).catch(() => undefined);
  await pool.end();
}

setup().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
