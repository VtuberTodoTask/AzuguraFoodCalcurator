import { Pool, QueryResult } from 'pg';

const connectionString = process.env.DATABASE_URL;

// Only create a pool if the connection string is provided.
// This allows the app to run without a database for local development.
export const pool = connectionString
  ? new Pool({
      connectionString,
      // Recommended settings for serverless environments like Render.
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  : undefined;

// The query function now checks if the pool exists before attempting to query.
export const query = (text: string, params?: any[]): Promise<QueryResult<any>> => {
  if (!pool) {
    throw new Error('Database is not connected. Did you set the DATABASE_URL environment variable?');
  }
  return pool.query(text, params);
};

