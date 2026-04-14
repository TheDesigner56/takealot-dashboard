import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

const DB_PATH = path.join(os.homedir(), '.openclaw/workspace/skills/takealot-intelligence/research/shadow_catalog.db');

interface RelistOpportunity {
  id: number;
  plid: number;
  optimized_title: string;
  current_price: number;
  recommended_price: number;
  margin_percent: number;
  confidence: number;
}

interface OpportunitiesResponse {
  opportunities: RelistOpportunity[];
  total: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minMargin = searchParams.get('minMargin') || '';
    const minConfidence = searchParams.get('minConfidence') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const db = new Database(DB_PATH, { readonly: true });

    // Build WHERE clause dynamically
    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    if (minMargin) {
      whereClauses.push('margin_percent >= ?');
      params.push(parseFloat(minMargin));
    }

    if (minConfidence) {
      whereClauses.push('confidence >= ?');
      params.push(parseFloat(minConfidence));
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM relist_opportunities ${whereClause}`;
    const countResult: { total: number } = db.prepare(countQuery).get(...params) as { total: number };
    const total = countResult.total;

    // Get results
    const query = `
      SELECT id, plid, optimized_title, current_price, recommended_price, margin_percent, confidence
      FROM relist_opportunities
      ${whereClause}
      ORDER BY margin_percent DESC
      LIMIT ?
    `;
    const opportunities = db.prepare(query).all(...params, limit) as RelistOpportunity[];

    db.close();

    const response: OpportunitiesResponse = {
      opportunities,
      total,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
