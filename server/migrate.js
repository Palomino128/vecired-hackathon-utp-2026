// ==============================================================================
// PROYECTO: VeciRed - Hackathon UTP 2026
// INTEGRANTE 2: Base de datos y lógica (Backend)
// ARCHIVO: server/migrate.js
// DESCRIPCIÓN: Ejecutor de migraciones SQL en PostgreSQL
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const client = await pool.connect();
  console.log('🔄 Iniciando proceso de migración de VeciRed en PostgreSQL...');

  try {
    const dbDir = path.resolve(__dirname, '../database');
    const files = [
      '001_schema.sql',
      '002_permissions_functions.sql',
      '006_solidarity_mobility.sql',
      '007_loan_lifecycle.sql',
    ];

    for (const file of files) {
      const filePath = path.join(dbDir, file);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Archivo no encontrado: ${filePath}`);
        continue;
      }

      console.log(`⏳ Ejecutando ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf-8');
      await client.query(sql);
      console.log(`✅ ${file} ejecutado con éxito.`);
    }

    console.log('✨ Todas las migraciones y datos de prueba se cargaron exitosamente en PostgreSQL.');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
