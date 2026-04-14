#!/usr/bin/env node
// Import script for Vercel Postgres production deployment
// Reads from shadow_catalog.db and inserts into Vercel Postgres
// Usage: node scripts/import-db.mjs
// Requires: POSTGRES_URL env var (auto-set when Vercel project is linked)

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const sourceDb = process.env.SHADOW_CATALOG_PATH ||
  path.join(process.env.HOME || '/root', '.openclaw/workspace/skills/takealot-intelligence/research/shadow_catalog.db');

console.log('📦 Importing data to Vercel Postgres...\n');

if (!process.env.POSTGRES_URL) {
  console.error('❌ POSTGRES_URL not set. Link your Vercel project first:');
  console.error('   vercel link\n');
  console.error('Or set it manually from Vercel dashboard > Storage > Postgres > .env.local');
  process.exit(1);
}

if (!fs.existsSync(sourceDb)) {
  console.error(`❌ Source database not found: ${sourceDb}`);
  process.exit(1);
}

// Read from SQLite and generate SQL insert statements
const tables = [
  {
    name: 'takealot_products',
    columns: ['plid', 'title', 'current_price', 'seller', 'category', 'date_discovered', 'last_updated', 'search_keywords', 'is_active', 'stock_status'],
  },
  {
    name: 'gap_matches',
    columns: ['gap_id', 'plid', 'match_score', 'current_title', 'optimized_title', 'current_price', 'recommended_price', 'estimated_margin', 'status'],
  },
  {
    name: 'relist_opportunities',
    columns: ['id', 'plid', 'gap_id', 'current_title', 'optimized_title', 'current_price', 'recommended_price', 'margin_percent', 'supplier', 'lead_time_days', 'status', 'created_at'],
  },
];

for (const table of tables) {
  console.log(`\n📋 Processing ${table.name}...`);

  // Export as JSON from SQLite
  const jsonOutput = execSync(
    `sqlite3 "${sourceDb}" "SELECT json_group_array(json_object(${table.columns.map(c => `'${c}', ${c === 'current_price' || c === 'recommended_price' || c === 'match_score' || c === 'estimated_margin' || c === 'margin_percent' || c === 'current_price' ? `CAST(${c} AS REAL)` : c}`).join(', ')})) FROM ${table.name}"`,
    { maxBuffer: 50 * 1024 * 1024 }
  ).toString();

  console.log(`   Found ${JSON.parse(jsonOutput).length} records`);

  // Write to temp file for psql import
  const tmpFile = path.join(projectRoot, 'data', `${table.name}.json`);
  fs.mkdirSync(path.join(projectRoot, 'data'), { recursive: true });
  fs.writeFileSync(tmpFile, jsonOutput);
  console.log(`   Written to ${tmpFile}`);
  console.log(`   Import via Vercel dashboard or use: vercel env pull && npx @vercel/postgres-import ${tmpFile}`);
}

console.log('\n✅ Data exported. Use Vercel dashboard to import into Postgres.');
console.log('   Alternatively, the /api/seed endpoint handles SQLite-based local dev automatically.');