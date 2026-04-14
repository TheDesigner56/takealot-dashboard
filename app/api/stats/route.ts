import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

const DB_PATH = path.join(os.homedir(), '.openclaw/workspace/skills/takealot-intelligence/research/shadow_catalog.db');

interface TableStats {
  table: string;
  count: number;
}

interface StatsResponse {
  tables: TableStats[];
  totalTables: number;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    // Get counts for each table
    const tables = [
      { table: 'takealot_products', count: 0 },
      { table: 'gap_matches', count: 0 },
      { table: 'relist_opportunities', count: 0 },
    ];

    for (const table of tables) {
      const query = `SELECT COUNT(*) as count FROM ${table.table}`;
      const result: { count: number } = db.prepare(query).get() as { count: number };
      table.count = result.count;
    }

    db.close();

    const response: StatsResponse = {
      tables,
      totalTables: tables.length,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
