import { Pool, types } from 'pg';

types.setTypeParser(20, Number);
types.setTypeParser(1700, Number);

// Supabase provides a PostgreSQL connection string. Use its transaction pooler
// endpoint for Vercel functions and keep the URL only in server environment vars.
const databaseUrl = process.env.DATABASE_URL;

export const pgPool = new Pool({
  connectionString: databaseUrl,
  ssl: true,
  max: 3,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

async function run<T>(sql: string, params: unknown[] = []): Promise<[T]> {
  if (!databaseUrl || !/^postgres(?:ql)?:\/\//.test(databaseUrl) || databaseUrl.includes('[YOUR-PASSWORD]')) {
    throw new Error('DATABASE_URL debe contener una URL PostgreSQL completa de Supabase.');
  }

  let index = 0;
  let statement = sql.replace(/\?/g, () => `$${++index}`);
  const insert = /^\s*INSERT\s+INTO\b/i.test(statement);
  if (insert && !/\bRETURNING\b/i.test(statement)) statement += ' RETURNING id';

  const result = await pgPool.query(statement, params);
  if (/^\s*(INSERT|UPDATE|DELETE)\b/i.test(statement)) {
    return [{ insertId: insert ? Number(result.rows[0]?.id) : 0, affectedRows: result.rowCount ?? 0 } as unknown as T];
  }
  return [result.rows as T];
}

// Preserve the small query/execute interface used by the route handlers.
export const pool = { query: run, execute: run };

