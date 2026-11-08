// ==============================================================================
// PROYECTO: VeciRed - Hackathon UTP 2026
// INTEGRANTE 2: Base de datos y lógica (Backend)
// ARCHIVO: server/db.js
// DESCRIPCIÓN: Pool de conexiones a PostgreSQL y helper de consultas
// ==============================================================================

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      database: process.env.POSTGRES_DB || 'vecired_db',
      user: process.env.POSTGRES_USER || 'vecired_user',
      password: process.env.POSTGRES_PASSWORD || 'vecired_pass_2026',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

export const pool = new Pool(poolConfig);

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PG Query] ${text.slice(0, 80)}... | Filas: ${res.rowCount} | ${duration}ms`);
    }
    return res;
  } catch (err) {
    console.error(`[PG Error] en query: ${text}`, err.message);
    throw err;
  }
}

export async function testConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as server_time, version() as version;');
    client.release();
    return {
      connected: true,
      serverTime: res.rows[0].server_time,
      version: res.rows[0].version,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
}

export default {
  pool,
  query,
  testConnection,
};
