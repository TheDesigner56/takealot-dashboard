// Database: JSON files for Vercel compatibility
import path from 'path';
import { promises as fs } from 'fs';

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

// ── Data Loading ────────────────────────────────────────────────
async function loadData() {
  const dataDir = path.join(process.cwd(), 'public', 'data');
  
  const [products, gaps, opportunities] = await Promise.all([
    fs.readFile(path.join(dataDir, 'products.json'), 'utf-8').then(JSON.parse),
    fs.readFile(path.join(dataDir, 'gaps.json'), 'utf-8').then(JSON.parse),
    fs.readFile(path.join(dataDir, 'opportunities.json'), 'utf-8').then(JSON.parse),
  ]);
  
  return { products, gaps, opportunities };
}

// ── Stats ─────────────────────────────────────────────────────
export async function getStats(): Promise<{
  products: number;
  gaps: number;
  opportunities: number;
  categories: number;
}> {
  const { products, gaps, opportunities } = await loadData();
  const categories = new Set(products.map((p: Product) => p.category)).size;
  
  return {
    products: products.length,
    gaps: gaps.length,
    opportunities: opportunities.length,
    categories,
  };
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
  
  const { products: allProducts } = await loadData();
  
  let filtered = allProducts.filter((p: Product) => {
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (category && p.category !== category) return false;
    if (seller && p.seller !== seller) return false;
    if (minPrice !== undefined && p.current_price < minPrice) return false;
    if (maxPrice !== undefined && p.current_price > maxPrice) return false;
    return true;
  });
  
  const total = filtered.length;
  
  // Sort
  filtered.sort((a: Product, b: Product) => {
    const aVal = a[sortBy as keyof Product];
    const bVal = b[sortBy as keyof Product];
    const cmp = String(aVal).localeCompare(String(bVal));
    return sortOrder === 'desc' ? -cmp : cmp;
  });
  
  // Paginate
  const offset = (page - 1) * limit;
  const products = filtered.slice(offset, offset + limit);
  
  return { products, total };
}

export async function getProductById(plid: string): Promise<Product | null> {
  const { products } = await loadData();
  return products.find((p: Product) => p.plid === plid) || null;
}

// ── Gaps ───────────────────────────────────────────────────────
export async function getGaps(opts: {
  page?: number;
  limit?: number;
  status?: string;
  minScore?: number;
}): Promise<{ gaps: GapMatch[]; total: number }> {
  const { page = 1, limit = 50, status, minScore } = opts;
  
  const { gaps: allGaps } = await loadData();
  
  let filtered = allGaps.filter((g: GapMatch) => {
    if (status && g.status !== status) return false;
    if (minScore !== undefined && g.match_score < minScore) return false;
    return true;
  });
  
  const total = filtered.length;
  
  // Sort by match score
  filtered.sort((a: GapMatch, b: GapMatch) => b.match_score - a.match_score);
  
  const offset = (page - 1) * limit;
  const gaps = filtered.slice(offset, offset + limit);
  
  return { gaps, total };
}

// ── Opportunities ──────────────────────────────────────────────
export async function getOpportunities(opts: {
  page?: number;
  limit?: number;
  minMargin?: number;
  minConfidence?: number;
}): Promise<{ opportunities: RelistOpportunity[]; total: number }> {
  const { page = 1, limit = 50, minMargin, minConfidence } = opts;
  
  const { opportunities: allOps } = await loadData();
  
  let filtered = allOps.filter((o: RelistOpportunity) => {
    if (minMargin !== undefined && o.margin_percent < minMargin) return false;
    if (minConfidence !== undefined && o.confidence < minConfidence) return false;
    return true;
  });
  
  const total = filtered.length;
  
  // Sort by margin then by price
  filtered.sort((a: RelistOpportunity, b: RelistOpportunity) => {
    return b.margin_percent - a.margin_percent;
  });
  
  const offset = (page - 1) * limit;
  const opportunities = filtered.slice(offset, offset + limit);
  
  return { opportunities, total };
}
