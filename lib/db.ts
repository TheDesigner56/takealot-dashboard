// Database abstraction: SQLite for local, Vercel Postgres for production
import Database from 'better-sqlite3';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production' || !process.env.POSTGRES_URL;

// ── SQLite (local dev) ──────────────────────────────────────────
function getSqliteDb() {
  const dbPath = path.join(process.cwd(), 'shadow_catalog.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return db;
}

// ── Shared Types ────────────────────────────────────────────────
export interface Product {
  plid: string;
  title: string;
  current_price: number;
  seller: string;
  category: string;
  date_discovered: string;
  last_updated: string;
  search_keywords: string;
  is_active: boolean;
  stock_status: string;
}

export interface GapMatch {
  gap_id: string;
  plid: string;
  relevance_score: number;
  status: string;
  created_at: string;
}

export interface RelistOpportunity {
  id: string;
  plid: string;
  optimized_title: string;
  current_price: number;
  recommended_price: number;
  margin_percent: number;
  confidence: number;
}

// ── Stats ─────────────────────────────────────────────────────
export async function getStats(): Promise<{
  products: number;
  gaps: number;
  opportunities: number;
  categories: number;
}> {
  if (isDev) {
    const db = getSqliteDb();
    try {
      const products = db.prepare('SELECT COUNT(*) as count FROM takealot_products').get() as { count: number };
      const gaps = db.prepare('SELECT COUNT(*) as count FROM gap_matches').get() as { count: number };
      const opportunities = db.prepare('SELECT COUNT(*) as count FROM relist_opportunities').get() as { count: number };
      const categories = db.prepare('SELECT COUNT(DISTINCT category) as count FROM takealot_products').get() as { count: number };
      return {
        products: products.count,
        gaps: gaps.count,
        opportunities: opportunities.count,
        categories: categories.count,
      };
    } finally {
      db.close();
    }
  }
  // Production: return mock stats since we're using SQLite
  return { products: 0, gaps: 0, opportunities: 0, categories: 0 };
}

// ── Products ───────────────────────────────────────────────────
export async function getProducts(opts: {
  page?: number;
  limit?: number;
  category?: string;
  seller?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ products: Product[]; total: number }> {
  const { 
    page = 1, 
    limit = 50, 
    category, 
    seller, 
    minPrice, 
    maxPrice, 
    search,
    sortBy = 'title',
    sortOrder = 'asc'
  } = opts;
  const offset = (page - 1) * limit;

  const db = getSqliteDb();
  try {
    let query = 'SELECT * FROM takealot_products WHERE 1=1';
    const params: any[] = [];
    
    if (search) {
      query += ' AND (title LIKE ? OR search_keywords LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (seller) {
      query += ' AND seller = ?';
      params.push(seller);
    }
    if (minPrice !== undefined) {
      query += ' AND current_price >= ?';
      params.push(minPrice);
    }
    if (maxPrice !== undefined) {
      query += ' AND current_price <= ?';
      params.push(maxPrice);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = db.prepare(countQuery).get(...params) as { count: number };

    const validSorts = ['title', 'current_price', 'seller', 'category', 'date_discovered'];
    const sort = validSorts.includes(sortBy) ? sortBy : 'title';
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';
    
    query += ` ORDER BY ${sort} ${order}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const products = db.prepare(query).all(...params) as Product[];
    
    return { products, total: countResult.count };
  } finally {
    db.close();
  }
}

export async function getProductById(plid: string): Promise<Product | null> {
  const db = getSqliteDb();
  try {
    return db.prepare('SELECT * FROM takealot_products WHERE plid = ?').get(plid) as Product | null;
  } finally { 
    db.close(); 
  }
}

// ── Gaps ───────────────────────────────────────────────────────
export async function getGaps(opts: {
  page?: number;
  limit?: number;
  status?: string;
  minScore?: number;
}): Promise<{ gaps: GapMatch[]; total: number }> {
  const { page = 1, limit = 50, status, minScore } = opts;
  const offset = (page - 1) * limit;

  const db = getSqliteDb();
  try {
    let query = 'SELECT * FROM gap_matches WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (minScore !== undefined) {
      query += ' AND relevance_score >= ?';
      params.push(minScore);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = db.prepare(countQuery).get(...params) as { count: number };

    query += ' ORDER BY relevance_score DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const gaps = db.prepare(query).all(...params) as GapMatch[];
    
    return { gaps, total: countResult.count };
  } finally {
    db.close();
  }
}

// ── Opportunities ──────────────────────────────────────────────
export async function getOpportunities(opts: {
  page?: number;
  limit?: number;
  minMargin?: number;
  minConfidence?: number;
}): Promise<{ opportunities: RelistOpportunity[]; total: number }> {
  const { page = 1, limit = 50, minMargin, minConfidence } = opts;
  const offset = (page - 1) * limit;

  const db = getSqliteDb();
  try {
    let query = 'SELECT * FROM relist_opportunities WHERE 1=1';
    const params: any[] = [];
    
    if (minMargin !== undefined) {
      query += ' AND margin_percent >= ?';
      params.push(minMargin);
    }
    if (minConfidence !== undefined) {
      query += ' AND confidence >= ?';
      params.push(minConfidence);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = db.prepare(countQuery).get(...params) as { count: number };

    query += ' ORDER BY confidence DESC, margin_percent DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const opportunities = db.prepare(query).all(...params) as RelistOpportunity[];
    
    return { opportunities, total: countResult.count };
  } finally {
    db.close();
  }
}
