import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_PUBLIC_URL;
const parsed = databaseUrl ? new URL(databaseUrl) : null;

if (parsed && parsed.protocol !== 'mysql:') {
  throw new Error('DATABASE_URL debe usar el protocolo mysql://');
}

export const pool = mysql.createPool({
  host: parsed?.hostname || process.env.DB_HOST || 'localhost',
  user: parsed ? decodeURIComponent(parsed.username) : process.env.DB_USER || 'root',
  password: parsed ? decodeURIComponent(parsed.password) : process.env.DB_PASSWORD ?? '',
  database: parsed ? decodeURIComponent(parsed.pathname.slice(1)) : process.env.DB_NAME || 'clinica_db',
  port: Number(parsed?.port || process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 5,
});

