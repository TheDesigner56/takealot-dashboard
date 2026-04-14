'use client';

import { useState, useEffect, useCallback } from 'react';

interface Opportunity {
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

interface OppsResponse {
  opportunities: Opportunity[];
  total: number;
}

function MarginBadge({ margin }: { margin: number }) {
  if (margin >= 40) return <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs font-medium">🔥 {margin.toFixed(1)}%</span>;
  if (margin >= 25) return <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-medium">{margin.toFixed(1)}%</span>;
  if (margin >= 15) return <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-xs">{margin.toFixed(1)}%</span>;
  return <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-xs">{margin.toFixed(1)}%</span>;
}

export default function OpportunitiesPage() {
  const [data, setData] = useState<OppsResponse>({ opportunities: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [minMargin, setMinMargin] = useState('');
  const [sortBy, setSortBy] = useState('margin_percent');
  const limit = 50;

  const fetchOpps = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(status && { status }),
      ...(minMargin && { minMargin }),
      sortBy,
      sortOrder: 'desc',
    });
    try {
      const res = await fetch(`/api/opportunities?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch opportunities:', err);
    } finally {
      setLoading(false);
    }
  }, [page, status, minMargin, sortBy]);

  useEffect(() => { fetchOpps(); }, [fetchOpps]);

  const totalPages = Math.ceil(data.total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Relist Opportunities</h1>
        <span className="text-sm text-[#8888a0]">{data.total} opportunities found</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-[#16161f] border border-[#232333] rounded-xl p-4">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-[#0a0a0f] border border-[#232333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={minMargin}
          onChange={(e) => { setMinMargin(e.target.value); setPage(1); }}
          className="bg-[#0a0a0f] border border-[#232333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">Any Margin</option>
          <option value="15">15%+ margin</option>
          <option value="25">25%+ margin</option>
          <option value="40">40%+ margin</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-[#0a0a0f] border border-[#232333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="margin_percent">Sort by Margin</option>
          <option value="current_price">Sort by Price</option>
          <option value="lead_time_days">Sort by Lead Time</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#16161f] border border-[#232333] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#232333]">
                <th className="text-left text-[#8888a0] font-medium px-4 py-3">Product</th>
                <th className="text-right text-[#8888a0] font-medium px-4 py-3 hidden sm:table-cell">Current</th>
                <th className="text-right text-[#8888a0] font-medium px-4 py-3">Target</th>
                <th className="text-center text-[#8888a0] font-medium px-4 py-3">Margin</th>
                <th className="text-left text-[#8888a0] font-medium px-4 py-3 hidden md:table-cell">Supplier</th>
                <th className="text-center text-[#8888a0] font-medium px-4 py-3 hidden lg:table-cell">Lead Time</th>
                <th className="text-left text-[#8888a0] font-medium px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-[#8888a0]">Loading...</td></tr>
              ) : data.opportunities.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-[#8888a0]">No opportunities found</td></tr>
              ) : (
                data.opportunities.map((o) => (
                  <tr key={o.id} className="border-b border-[#232333]/50 hover:bg-[#232333]/30 transition-colors">
                    <td className="px-4 py-3">
                      <a href={`/products/${o.plid}`} className="text-white hover:text-indigo-400 transition-colors font-medium block max-w-[280px] truncate">
                        {o.optimized_title || o.current_title}
                      </a>
                      {o.optimized_title && o.optimized_title !== o.current_title && (
                        <div className="text-xs text-[#8888a0] truncate max-w-[280px]">{o.current_title}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[#8888a0] hidden sm:table-cell">R{o.current_price}</td>
                    <td className="px-4 py-3 text-right text-indigo-400 font-medium">R{o.recommended_price}</td>
                    <td className="px-4 py-3 text-center"><MarginBadge margin={o.margin_percent} /></td>
                    <td className="px-4 py-3 text-[#8888a0] hidden md:table-cell">{o.supplier || '—'}</td>
                    <td className="px-4 py-3 text-center text-[#8888a0] hidden lg:table-cell">{o.lead_time_days ? `${o.lead_time_days}d` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${o.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : o.status === 'completed' ? 'bg-blue-500/10 text-blue-400' : 'bg-[#232333] text-[#8888a0]'}`}>{o.status}</span>
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
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 text-sm bg-[#16161f] border border-[#232333] rounded-lg text-white disabled:opacity-30 hover:border-indigo-500 transition-colors">← Previous</button>
          <span className="text-sm text-[#8888a0]">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm bg-[#16161f] border border-[#232333] rounded-lg text-white disabled:opacity-30 hover:border-indigo-500 transition-colors">Next →</button>
        </div>
      )}
    </div>
  );
}