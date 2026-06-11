import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { newDb, DataType, IMemoryDb } from 'pg-mem';
import { setPool } from './db';
import { runSeed } from '../data/seedData';

function getSchemaPath(): string {
  return path.join(__dirname, '../../../database/schema.sql');
}

function createMemoryPool(): Pool {
  const db: IMemoryDb = newDb();

  db.public.registerFunction({
    name: 'current_date',
    returns: DataType.date,
    implementation: () => new Date().toISOString().slice(0, 10),
  });

  db.public.registerFunction({
    name: 'now',
    returns: DataType.timestamptz,
    implementation: () => new Date(),
  });

  const { Pool: MemPool } = db.adapters.createPg();
  return new MemPool() as unknown as Pool;
}

async function applySchema(pool: Pool, isMemory: boolean): Promise<void> {
  let schema = fs.readFileSync(getSchemaPath(), 'utf-8');
  if (isMemory) {
    schema = schema.replace(/CREATE EXTENSION[^;]+;/gi, '');
  }
  await pool.query(schema);
}

function useSsl(connectionString: string): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    connectionString.includes('sslmode=require') ||
    connectionString.includes('neon.tech')
  );
}

async function tryPostgresPool(): Promise<Pool | null> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
    ssl: useSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await pool.query('SELECT 1');
    return pool;
  } catch {
    await pool.end().catch(() => undefined);
    return null;
  }
}

export async function initDatabase(): Promise<'postgres' | 'memory'> {
  let pool: Pool;
  let mode: 'postgres' | 'memory';

  if (process.env.USE_MEMORY_DB === 'true') {
    pool = createMemoryPool();
    mode = 'memory';
  } else {
    const postgresPool = await tryPostgresPool();
    if (postgresPool) {
      pool = postgresPool;
      mode = 'postgres';
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Could not connect to PostgreSQL. Set DATABASE_URL to a valid connection string.'
      );
    } else {
      console.warn('PostgreSQL not available. Using in memory database for local demo.');
      pool = createMemoryPool();
      mode = 'memory';
    }
  }

  setPool(pool);
  await applySchema(pool, mode === 'memory');

  const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM customers');
  const count = Number(countResult.rows[0]?.count ?? 0);

  if (mode === 'memory' || count === 0) {
    console.log('Seeding demo data...');
    await runSeed(pool, { clear: count > 0 });
    console.log('Demo data loaded successfully.');
  }

  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
  });

  console.log(`Database ready (${mode} mode)`);
  return mode;
}
