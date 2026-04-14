import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

const DB_PATH = path.join(os.homedir(), '.openclaw/workspace/skills/takealot-intelligence/research/shadow_catalog.db');

interface GapMatch {
  gap_id: string;
  plid: number;
  relevance_score: number;
  status: string;
  created_at: string;
}

interface GapsResponse {
  gaps: GapMatch[];
  total: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const minRelevance = searchParams.get('minRelevance') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const db = new Database(DB_PATH, { readonly: true });

    // Build WHERE clause dynamically
    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    if (minRelevance) {
      whereClauses.push('relevance_score >= ?');
      params.push(parseFloat(minRelevance));
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM gap_matches ${whereClause}`;
    const countResult: { total: number } = db.prepare(countQuery).get(...params) as { total: number };
    const total = countResult.total;

    // Get results
    const query = `
      SELECT gap_id, plid, relevance_score, status, created_at
      FROM gap_matches
      ${whereClause}
      ORDER BY relevance_score DESC
      LIMIT ?
    `;
    const gaps = db.prepare(query).all(...params, limit) as GapMatch[];

    db.close();

    const response: GapsResponse = {
      gaps,
      total,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching gaps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gap matches', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
