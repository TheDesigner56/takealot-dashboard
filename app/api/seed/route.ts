import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST() {
  try {
    const sourceDb = process.env.SHADOW_CATALOG_PATH ||
      path.join(process.env.HOME || '/root', '.openclaw/workspace/skills/takealot-intelligence/research/shadow_catalog.db');

    if (!fs.existsSync(sourceDb)) {
      return NextResponse.json(
        { error: `Source database not found at ${sourceDb}. Set SHADOW_CATALOG_PATH env var.` },
        { status: 404 }
      );
    }

    const targetDb = path.join(process.cwd(), 'shadow_catalog.db');

    // Copy source database to target
    fs.copyFileSync(sourceDb, targetDb);

    // Verify
    const Database = require('better-sqlite3');
    const db = new Database(targetDb);
    const counts = {
      products: (db.prepare('SELECT COUNT(*) as c FROM takealot_products').get() as any).c,
      gaps: (db.prepare('SELECT COUNT(*) as c FROM gap_matches').get() as any).c,
      opportunities: (db.prepare('SELECT COUNT(*) as c FROM relist_opportunities').get() as any).c,
    };
    db.close();

    return NextResponse.json({
      success: true,
      message: 'Database seeded from shadow_catalog.db',
      source: sourceDb,
      counts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}