'use client';

import { useState, useEffect, useCallback } from 'react';

interface GapMatch {
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

interface GapsResponse {
  gaps: GapMatch[];
  total: number;
}

export default function GapsPage() {
  const [data, setData] = useState<GapsResponse>({ gaps: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [minScore, setMinScore] = useState('');
  const limit = 50;

  const fetchGaps = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(status && { status }),
      ...(minScore && { minScore }),
    });
    try {
      const res = await fetch(`/api/gaps?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch gaps:', err);
    } finally {
      setLoading(false);
    }
  }, [page, status, minScore]);

  useEffect(() => { fetchGaps(); }, [fetchGaps]);

  const totalPages = Math.ceil(data.total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gap Explorer</h1>
        <span className="text-sm text-[#8888a0]">{data.total} gaps discovered</span>
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
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <input
          type="number"
          placeholder="Min score (0-1)"
          value={minScore}
          onChange={(e) => { setMinScore(e.target.value); setPage(1); }}
          className="w-36 bg-[#0a0a0f] border border-[#232333] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8888a0] focus:outline-none focus:border-indigo-500"
          step="0.1"
          min="0"
          max="1"
        />
      </div>

      {/* Gap Cards */}
      {loading ? (
        <div className="text-center py-12 text-[#8888a0]">Loading gaps...</div>
      ) : data.gaps.length === 0 ? (
        <div className="text-center py-12 text-[#8888a0]">No gaps found</div>
      ) : (
        <div className="space-y-3">
          {data.gaps.map((g, i) => (
            <div key={i} className="bg-[#16161f] border border-[#232333] rounded-xl p-5 hover:border-indigo-500/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <a href={`/products/${g.plid}`} className="text-white hover:text-indigo-400 transition-colors font-medium">
                    {g.current_title?.length > 80 ? g.current_title.slice(0, 80) + '…' : g.current_title}
                  </a>
                  {g.optimized_title && (
                    <div className="text-sm text-indigo-400 mt-1">
                      → {g.optimized_title.length > 80 ? g.optimized_title.slice(0, 80) + '…' : g.optimized_title}
                    </div>
                  )}
                </div>
                <div className="ml-4 text-right flex-shrink-0">
                  <div className="text-xs text-[#8888a0]">Match</div>
                  <div className="text-xl font-bold text-white">{(g.match_score * 100).toFixed(0)}%</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-[#8888a0]">
                <span>PLID: {g.plid}</span>
                {g.current_price > 0 && <span>Current: R{g.current_price}</span>}
                {g.recommended_price > 0 && <span className="text-indigo-400">Recommended: R{g.recommended_price}</span>}
                {g.estimated_margin > 0 && <span className="text-emerald-400">Margin: {(g.estimated_margin * 100).toFixed(1)}%</span>}
                <span className={`px-2 py-0.5 rounded ${g.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#232333] text-[#8888a0]'}`}>{g.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

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