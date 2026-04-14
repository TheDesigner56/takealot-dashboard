import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

const DB_PATH = path.join(os.homedir(), '.openclaw/workspace/skills/takealot-intelligence/research/shadow_catalog.db');

interface TakealotProduct {
  plid: number;
  title: string;
  price: number;
  category: string;
  subcategory: string;
  seller: string;
  images: string;
  reviews_count: number;
  rating: number;
  buybox_price: number;
  url: string;
}

interface ProductsResponse {
  products: TakealotProduct[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const category = searchParams.get('category') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const search = searchParams.get('search') || '';

    const db = new Database(DB_PATH, { readonly: true });

    // Build WHERE clause dynamically
    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    if (category) {
      whereClauses.push('category = ?');
      params.push(category);
    }

    if (minPrice) {
      whereClauses.push('price >= ?');
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      whereClauses.push('price <= ?');
      params.push(parseFloat(maxPrice));
    }

    if (search) {
      whereClauses.push('(title LIKE ? OR seller LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM takealot_products ${whereClause}`;
    const countResult: { total: number } = db.prepare(countQuery).get(...params) as { total: number };
    const total = countResult.total;

    // Get paginated results
    const query = `
      SELECT plid, title, price, category, subcategory, seller, images, reviews_count, rating, buybox_price, url
      FROM takealot_products
      ${whereClause}
      ORDER BY plid
      LIMIT ? OFFSET ?
    `;
    const products = db.prepare(query).all(...params, limit, offset) as TakealotProduct[];

    db.close();

    const response: ProductsResponse = {
      products,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + products.length < total,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
