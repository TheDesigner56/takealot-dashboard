#!/usr/bin/env node
// Seed script: copies shadow_catalog.db from source to project root
// Usage: node scripts/seed.mjs
// Or via API: POST /api/seed

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const sourceDb = process.env.SHADOW_CATALOG_PATH ||
  path.join(process.env.HOME || '/root', '.openclaw/workspace/skills/takealot-intelligence/research/shadow_catalog.db');

const targetDb = path.join(projectRoot, 'shadow_catalog.db');

console.log('🌱 Seeding Takealot Intelligence Dashboard...\n');
console.log(`   Source: ${sourceDb}`);
console.log(`   Target: ${targetDb}`);

if (!fs.existsSync(sourceDb)) {
  console.error(`\n❌ Source database not found at ${sourceDb}`);
  console.error('   Set SHADOW_CATALOG_PATH env var or ensure the default path exists.');
  process.exit(1);
}

// Copy
fs.copyFileSync(sourceDb, targetDb);
console.log('\n✅ Database copied successfully');

// Verify with sqlite3
try {
  const products = execSync(`sqlite3 "${targetDb}" "SELECT COUNT(*) FROM takealot_products"`).toString().trim();
  const gaps = execSync(`sqlite3 "${targetDb}" "SELECT COUNT(*) FROM gap_matches"`).toString().trim();
  const opps = execSync(`sqlite3 "${targetDb}" "SELECT COUNT(*) FROM relist_opportunities"`).toString().trim();
  console.log(`\n📊 Database stats:`);
  console.log(`   Products:      ${products}`);
  console.log(`   Gap Matches:   ${gaps}`);
  console.log(`   Opportunities:  ${opps}`);
} catch (err) {
  console.log('   (sqlite3 not available for verification, but copy succeeded)');
}

console.log('\n🚀 Run `npm run dev` to start the dashboard.');