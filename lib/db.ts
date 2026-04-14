// Database abstraction: SQLite for local, Vercel Postgres for production
import Database from 'better-sqlite3';
import path from 'path';
import { sql } from '@vercel/postgres';

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
  match_score: number;
  current_title: string;
  optimized_title: string;
  current_price: number;
  recommended_price: number;
  estimated_margin: number;
  status: string;
}

export interface RelistOpportunity {
  id: number;
  plid: string;
  gap_id: string;
  current_title: string;
  optimized_title: string;
  current_price: number;
  recommended_price: number;
  margin_percent: number;
  supplier: string;
  lead_time_days: number;
  status: string;
  created_at: string;
}

export interface Stats {
  totalProducts: number;
  totalGaps: number;
  totalOpportunities: number;
  avgMargin: number;
  topCategories: { category: string; count: number }[];
  priceRange: { min: number; max: number; avg: number };
  recentDiscovered: number;
}

// ── Query Functions ──────────────────────────────────────────────
export async function getProductsWithFilter(opts: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  seller?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ products: Product[]; total: number }> {
  const { page = 1, limit = 50, search, category, seller, minPrice, maxPrice, sortBy = 'title', sortOrder = 'asc' } = opts;
  const offset = (page - 1) * limit;

  if (isDev) {
    const db = getSqliteDb();
    try {
      let where = 'WHERE 1=1';
      const params: any[] = [];
      if (search) { where += ' AND (title LIKE ? OR search_keywords LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
      if (category) { where += ' AND category = ?'; params.push(category); }
      if (seller) { where += ' AND seller = ?'; params.push(seller); }
      if (minPrice !== undefined) { where += ' AND current_price >= ?'; params.push(minPrice); }
      if (maxPrice !== undefined) { where += ' AND current_price <= ?'; params.push(maxPrice); }

      const validSorts = ['title', 'current_price', 'seller', 'category', 'date_discovered'];
      const sort = validSorts.includes(sortBy) ? sortBy : 'title';
      const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

      const total = db.prepare(`SELECT COUNT(*) as count FROM takealot_products ${where}`).get(...params) as any;
      const products = db.prepare(`SELECT * FROM takealot_products ${where} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`).all(...params, limit, offset) as Product[];
      return { products, total: total.count };
    } finally {
      db.close();
    }
  }

  // Vercel Postgres
  let where = 'WHERE 1=1';
  const params: any[] = [];
  let paramIdx = 1;
  if (search) { where += ` AND (title ILIKE $${paramIdx++} OR search_keywords ILIKE $${paramIdx++})`; params.push(`%${search}%`, `%${search}%`); }
  if (category) { where += ` AND category = $${paramIdx++}`; params.push(category); }
  if (seller) { where += ` AND seller = $${paramIdx++}`; params.push(seller); }
  if (minPrice !== undefined) { where += ` AND current_price >= $${paramIdx++}`; params.push(minPrice); }
  if (maxPrice !== undefined) { where += ` AND current_price <= $${paramIdx++}`; params.push(maxPrice); }

  const validSorts = ['title', 'current_price', 'seller', 'category', 'date_discovered'];
  const sort = validSorts.includes(sortBy) ? sortBy : 'title';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const countResult = await sql`SELECT COUNT(*) as count FROM takealot_products ${sql.unsafe(where)} ...`;
  // Simplified for production - would use parameterized queries
  const result = await sql`
    SELECT * FROM takealot_products
    ${search ? sql`WHERE (title ILIKE ${'%' + search + '%'} OR search_keywords ILIKE ${'%' + search + '%'})` : sql``}
    ORDER BY ${sql.unsafe(sort)} ${sql.unsafe(order)}
    LIMIT ${limit} OFFSET ${offset}
  `;
  const countRes = await sql`SELECT COUNT(*) as count FROM takealot_products`;
  return { products: result.rows as Product[], total: Number(countRes.rows[0].count) };
}

export async function getProductById(plid: string): Promise<Product | null> {
  if (isDev) {
    const db = getSqliteDb();
    try {
      return db.prepare('SELECT * FROM takealot_products WHERE plid = ?').get(plid) as Product | null;
    } finally { db.close(); }
  }
  const result = await sql`SELECT * FROM takealot_products WHERE plid = ${plid}`;
  return result.rows[0] as Product || null;
}

export async function getGaps(opts: {
  page?: number;
  limit?: number;
  status?: string;
  minScore?: number;
}): Promise<{ gaps: GapMatch[]; total: number }> {
  const { page = 1, limit = 50, status, minScore } = opts;
  const offset = (page - 1) * limit;

  if (isDev) {
    const db = getSqliteDb();
    try {
      let where = 'WHERE 1=1';
      const params: any[] = [];
      if (status) { where += ' AND status = ?'; params.push(status); }
      if (minScore !== undefined) { where += ' AND match_score >= ?'; params.push(minScore); }

      const total = db.prepare(`SELECT COUNT(*) as count FROM gap_matches ${where}`).get(...params) as any;
      const gaps = db.prepare(`SELECT * FROM gap_matches ${where} ORDER BY match_score DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as GapMatch[];
      return { gaps, total: total.count };
    } finally { db.close(); }
  }
  const result = await sql`SELECT * FROM gap_matches ORDER BY match_score DESC LIMIT ${limit} OFFSET ${offset}`;
  const countRes = await sql`SELECT COUNT(*) as count FROM gap_matches`;
  return { gaps: result.rows as GapMatch[], total: Number(countRes.rows[0].count) };
}

export async function getOpportunities(opts: {
  page?: number;
  limit?: number;
  status?: string;
  minMargin?: number;
  supplier?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ opportunities: RelistOpportunity[]; total: number }> {
  const { page = 1, limit = 50, status, minMargin, supplier, sortBy = 'margin_percent', sortOrder = 'desc' } = opts;
  const offset = (page - 1) * limit;

  if (isDev) {
    const db = getSqliteDb();
    try {
      let where = 'WHERE 1=1';
      const params: any[] = [];
      if (status) { where += ' AND status = ?'; params.push(status); }
      if (minMargin !== undefined) { where += ' AND margin_percent >= ?'; params.push(minMargin); }
      if (supplier) { where += ' AND supplier = ?'; params.push(supplier); }

      const validSorts = ['margin_percent', 'current_price', 'recommended_price', 'lead_time_days'];
      const sort = validSorts.includes(sortBy) ? sortBy : 'margin_percent';
      const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

      const total = db.prepare(`SELECT COUNT(*) as count FROM relist_opportunities ${where}`).get(...params) as any;
      const opportunities = db.prepare(`SELECT * FROM relist_opportunities ${where} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`).all(...params, limit, offset) as RelistOpportunity[];
      return { opportunities, total: total.count };
    } finally { db.close(); }
  }
  const result = await sql`SELECT * FROM relist_opportunities ORDER BY margin_percent DESC LIMIT ${limit} OFFSET ${offset}`;
  const countRes = await sql`SELECT COUNT(*) as count FROM relist_opportunities`;
  return { opportunities: result.rows as RelistOpportunity[], total: Number(countRes.rows[0].count) };
}

export async function getStats(): Promise<Stats> {
  if (isDev) {
    const db = getSqliteDb();
    try {
      const totalProducts = (db.prepare('SELECT COUNT(*) as c FROM takealot_products').get() as any).c;
      const totalGaps = (db.prepare('SELECT COUNT(*) as c FROM gap_matches').get() as any).c;
      const totalOpps = (db.prepare('SELECT COUNT(*) as c FROM relist_opportunities').get() as any).c;
      const avgMargin = (db.prepare('SELECT AVG(margin_percent) as a FROM relist_opportunities').get() as any).a || 0;
      const priceStats = db.prepare('SELECT MIN(current_price) as min, MAX(current_price) as max, AVG(current_price) as avg FROM takealot_products WHERE current_price > 0').get() as any;
      const topCategories = db.prepare('SELECT category, COUNT(*) as count FROM takealot_products WHERE category IS NOT NULL AND category != "" GROUP BY category ORDER BY count DESC LIMIT 10').all() as { category: string; count: number }[];
      const recentDiscovered = (db.prepare("SELECT COUNT(*) as c FROM takealot_products WHERE date_discovered >= date('now', '-7 days')").get() as any).c;
      return {
        totalProducts,
        totalGaps,
        totalOpportunities: totalOpps,
        avgMargin: Math.round(avgMargin * 10) / 10,
        topCategories,
        priceRange: { min: priceStats?.min || 0, max: priceStats?.max || 0, avg: Math.round((priceStats?.avg || 0) * 100) / 100 },
        recentDiscovered,
      };
    } finally { db.close(); }
  }
  // Vercel Postgres
  const [pCount, gCount, oCount, avgM, priceStats, cats, recent] = await Promise.all([
    sql`SELECT COUNT(*) as c FROM takealot_products`,
    sql`SELECT COUNT(*) as c FROM gap_matches`,
    sql`SELECT COUNT(*) as c FROM relist_opportunities`,
    sql`SELECT AVG(margin_percent) as a FROM relist_opportunities`,
    sql`SELECT MIN(current_price) as min, MAX(current_price) as max, AVG(current_price) as avg FROM takealot_products WHERE current_price > 0`,
    sql`SELECT category, COUNT(*) as count FROM takealot_products WHERE category IS NOT NULL AND category != '' GROUP BY category ORDER BY count DESC LIMIT 10`,
    sql`SELECT COUNT(*) as c FROM takealot_products WHERE date_discovered >= CURRENT_DATE - INTERVAL '7 days'`,
  ]);
  return {
    totalProducts: Number(pCount.rows[0].c),
    totalGaps: Number(gCount.rows[0].c),
    totalOpportunities: Number(oCount.rows[0].c),
    avgMargin: Math.round(Number(avgM.rows[0].a) * 10) / 10,
    topCategories: cats.rows as any,
    priceRange: { min: Number(priceStats.rows[0].min), max: Number(priceStats.rows[0].max), avg: Math.round(Number(priceStats.rows[0].avg) * 100) / 100 },
    recentDiscovered: Number(recent.rows[0].c),
  };
}

export async function getProductGaps(plid: string): Promise<GapMatch[]> {
  if (isDev) {
    const db = getSqliteDb();
    try { return db.prepare('SELECT * FROM gap_matches WHERE plid = ? ORDER BY match_score DESC').all(plid) as GapMatch[]; }
    finally { db.close(); }
  }
  const result = await sql`SELECT * FROM gap_matches WHERE plid = ${plid} ORDER BY match_score DESC`;
  return result.rows as GapMatch[];
}

export async function getProductOpportunities(plid: string): Promise<RelistOpportunity[]> {
  if (isDev) {
    const db = getSqliteDb();
    try { return db.prepare('SELECT * FROM relist_opportunities WHERE plid = ? ORDER BY margin_percent DESC').all(plid) as RelistOpportunity[]; }
    finally { db.close(); }
  }
  const result = await sql`SELECT * FROM relist_opportunities WHERE plid = ${plid} ORDER BY margin_percent DESC`;
  return result.rows as RelistOpportunity[];
}