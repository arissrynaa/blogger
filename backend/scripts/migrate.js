#!/usr/bin/env node
/**
 * Migration runner untuk backend blogger.
 *
 * Menjalankan seluruh file .sql di db/migrations secara berurutan.
 * Yang sudah pernah dijalankan dicatat di tabel schema_migrations sehingga
 * aman dipanggil berkali-kali (idempotent, aman untuk Railway deploy).
 *
 * Usage: node scripts/migrate.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

const poolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 1,
  connectionTimeoutMillis: 15000,
};

async function main() {
  if (!poolConfig.host || !poolConfig.database || !poolConfig.user) {
    console.error('[migrate] ERROR: DB_HOST / DB_NAME / DB_USER env vars tidak lengkap.');
    process.exit(1);
  }

  const pool = new Pool(poolConfig);
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => /^\d+_.*\.sql$/.test(f) && !f.endsWith('_down.sql'))
      .sort();

    if (files.length === 0) {
      console.log('[migrate] Tidak ada file migration.');
      return;
    }

    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.name));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrate] SKIP ${file} (sudah diterapkan)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`[migrate] APPLY ${file}`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Gagal menjalankan ${file}: ${err.message}`);
      }
    }

    console.log('[migrate] Selesai. Semua migration sudah diterapkan.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(`[migrate] ${err.message}`);
  process.exit(1);
});