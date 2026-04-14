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

interface ProductResponse {
  product: TakealotProduct | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const plid = parseInt(id, 10);

    if (isNaN(plid)) {
      return NextResponse.json(
        { error: 'Invalid product ID. PLID must be a number.' },
        { status: 400 }
      );
    }

    const db = new Database(DB_PATH, { readonly: true });

    const query = `
      SELECT plid, title, price, category, subcategory, seller, images, reviews_count, rating, buybox_price, url
      FROM takealot_products
      WHERE plid = ?
    `;
    const product = db.prepare(query).get(plid) as TakealotProduct | undefined;

    db.close();

    if (!product) {
      return NextResponse.json(
        { error: `Product with PLID ${plid} not found` },
        { status: 404 }
      );
    }

    const response: ProductResponse = { product };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
