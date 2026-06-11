import { Pool } from 'pg';

let _pool: Pool | null = null;

export function setPool(pool: Pool): void {
  _pool = pool;
}

export function getPool(): Pool {
  if (!_pool) {
    throw new Error('Database not initialized. Server is still starting up.');
  }
  return _pool;
}

const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const p = getPool();
    const value = (p as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(p);
    }
    return value;
  },
});

export default pool;
