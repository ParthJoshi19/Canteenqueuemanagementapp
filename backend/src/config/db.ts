import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
function parseSslEnabled(value: string | undefined, defaultVal: boolean): boolean {
  if (value === undefined) return defaultVal;
  return !['false', '0', 'no'].includes(value.toLowerCase());
}

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const isRemoteDb = hasDatabaseUrl && !process.env.DATABASE_URL?.includes('localhost') && !process.env.DATABASE_URL?.includes('127.0.0.1');
const sslEnabled = parseSslEnabled(process.env.DB_SSL, isRemoteDb);
const sslConfig = sslEnabled ? { rejectUnauthorized: false } : false;

export const pool = new Pool(
  hasDatabaseUrl
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: sslConfig,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'canteen',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        ssl: sslConfig,
      },
);

export async function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function connectDB(): Promise<void> {
  await pool.query('SELECT 1');
  console.log('Connected to PostgreSQL');
}
