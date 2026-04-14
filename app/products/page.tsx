'use client';

import { useState, useEffect, useCallback } from 'react';

interface Product {
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

interface ProductsResponse {
  products: Product[];
  total: number;
}

export default function ProductsPage() {
  const [data, setData] = useState<ProductsResponse>({ products: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const limit = 50;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(search && { search }),
      ...(category && { category }),
      sortBy,
      sortOrder,
    });
    try {
      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, sortBy, sortOrder]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const totalPages = Math.ceil(data.total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <span className="text-sm text-[#8888a0]">{data.total.toLocaleString()} total</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-[#16161f] border border-[#232333] rounded-xl p-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] bg-[#0a0a0f] border border-[#232333] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8888a0] focus:outline-none focus:border-indigo-500"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="bg-[#0a0a0f] border border-[#232333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Categories</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-[#0a0a0f] border border-[#232333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="title">Title</option>
          <option value="current_price">Price</option>
          <option value="seller">Seller</option>
          <option value="date_discovered">Date</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-2 text-sm bg-[#0a0a0f] border border-[#232333] rounded-lg text-white hover:border-indigo-500 transition-colors"
        >
          {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#16161f] border border-[#232333] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#232333]">
                <th className="text-left text-[#8888a0] font-medium px-4 py-3">Product</th>
                <th className="text-left text-[#8888a0] font-medium px-4 py-3">Price</th>
                <th className="text-left text-[#8888a0] font-medium px-4 py-3 hidden md:table-cell">Seller</th>
                <th className="text-left text-[#8888a0] font-medium px-4 py-3 hidden lg:table-cell">Category</th>
                <th className="text-left text-[#8888a0] font-medium px-4 py-3 hidden sm:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-[#8888a0]">Loading...</td></tr>
              ) : data.products.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-[#8888a0]">No products found</td></tr>
              ) : (
                data.products.map((p) => (
                  <tr key={p.plid} className="border-b border-[#232333]/50 hover:bg-[#232333]/30 transition-colors">
                    <td className="px-4 py-3">
                      <a href={`/products/${p.plid}`} className="text-white hover:text-indigo-400 transition-colors font-medium">
                        {p.title?.length > 60 ? p.title.slice(0, 60) + '…' : p.title}
                      </a>
                      <div className="text-xs text-[#8888a0] mt-0.5">{p.plid}</div>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">R{p.current_price?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#8888a0] hidden md:table-cell">{p.seller}</td>
                    <td className="px-4 py-3 text-[#8888a0] hidden lg:table-cell">
                      <span className="bg-[#232333] px-2 py-0.5 rounded text-xs">{p.category}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${p.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm bg-[#16161f] border border-[#232333] rounded-lg text-white disabled:opacity-30 hover:border-indigo-500 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-[#8888a0]">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm bg-[#16161f] border border-[#232333] rounded-lg text-white disabled:opacity-30 hover:border-indigo-500 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}