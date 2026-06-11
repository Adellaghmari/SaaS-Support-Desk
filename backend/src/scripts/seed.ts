import { initDatabase } from '../config/initDatabase';
import { getPool } from '../config/db';
import { runSeed } from '../data/seedData';

async function seed() {
  await initDatabase();
  const pool = getPool();
  console.log('Seeding database...');
  await runSeed(pool, { clear: true });
  console.log('Seed completed successfully!');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
