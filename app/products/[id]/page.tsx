import { getProductById, getProductGaps, getProductOpportunities } from '@/lib/db';
import Link from 'next/link';

export const revalidate = 60;

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id);

  if (!product) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-2">Product Not Found</h1>
        <p className="text-[#8888a0] mb-4">No product with ID: {params.id}</p>
        <Link href="/products" className="text-indigo-400 hover:text-indigo-300">← Back to Products</Link>
      </div>
    );
  }

  const [gaps, opportunities] = await Promise.all([
    getProductGaps(params.id),
    getProductOpportunities(params.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#8888a0]">
        <Link href="/products" className="hover:text-indigo-400">Products</Link>
        <span>/</span>
        <span className="text-white">{product.plid}</span>
      </div>

      {/* Product Header */}
      <div className="bg-[#16161f] border border-[#232333] rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white mb-2">{product.title}</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <div className="text-xs text-[#8888a0] uppercase">Price</div>
                <div className="text-lg font-bold text-white">R{product.current_price?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-[#8888a0] uppercase">Seller</div>
                <div className="text-sm text-white">{product.seller || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-[#8888a0] uppercase">Category</div>
                <div className="text-sm text-white">{product.category || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-[#8888a0] uppercase">Status</div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs ${product.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
        {product.search_keywords && (
          <div className="mt-4 pt-4 border-t border-[#232333]">
            <div className="text-xs text-[#8888a0] uppercase mb-2">Search Keywords</div>
            <div className="flex flex-wrap gap-2">
              {product.search_keywords.split(',').map((kw, i) => (
                <span key={i} className="bg-[#232333] px-2 py-0.5 rounded text-xs text-[#8888a0]">{kw.trim()}</span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-[#232333] flex gap-6 text-xs text-[#8888a0]">
          <span>Discovered: {product.date_discovered}</span>
          <span>Updated: {product.last_updated}</span>
          <span>Stock: {product.stock_status || 'Unknown'}</span>
        </div>
      </div>

      {/* Gap Matches */}
      {gaps.length > 0 && (
        <div className="bg-[#16161f] border border-[#232333] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Gap Matches ({gaps.length})</h2>
          <div className="space-y-3">
            {gaps.map((g, i) => (
              <div key={i} className="bg-[#0a0a0f] border border-[#232333] rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">{g.current_title}</div>
                    {g.optimized_title && (
                      <div className="text-sm text-indigo-400 mt-1">→ {g.optimized_title}</div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xs text-[#8888a0]">Score</div>
                    <div className="text-lg font-bold text-white">{(g.match_score * 100).toFixed(0)}%</div>
                  </div>
                </div>
                <div className="flex gap-4 mt-3 text-xs text-[#8888a0]">
                  {g.current_price && <span>Current: R{g.current_price}</span>}
                  {g.recommended_price && <span>Recommended: R{g.recommended_price}</span>}
                  {g.estimated_margin && <span className="text-emerald-400">Margin: {(g.estimated_margin * 100).toFixed(1)}%</span>}
                  <span className={`px-2 py-0.5 rounded ${g.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#232333] text-[#8888a0]'}`}>{g.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relist Opportunities */}
      {opportunities.length > 0 && (
        <div className="bg-[#16161f] border border-[#232333] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Relist Opportunities ({opportunities.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#232333]">
                  <th className="text-left text-[#8888a0] font-medium px-3 py-2">Optimized Title</th>
                  <th className="text-right text-[#8888a0] font-medium px-3 py-2">Current</th>
                  <th className="text-right text-[#8888a0] font-medium px-3 py-2">Recommended</th>
                  <th className="text-right text-[#8888a0] font-medium px-3 py-2">Margin</th>
                  <th className="text-left text-[#8888a0] font-medium px-3 py-2">Supplier</th>
                  <th className="text-left text-[#8888a0] font-medium px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((o) => (
                  <tr key={o.id} className="border-b border-[#232333]/50 hover:bg-[#232333]/30">
                    <td className="px-3 py-2 text-white max-w-[300px] truncate">{o.optimized_title}</td>
                    <td className="px-3 py-2 text-white text-right">R{o.current_price}</td>
                    <td className="px-3 py-2 text-indigo-400 text-right">R{o.recommended_price}</td>
                    <td className="px-3 py-2 text-emerald-400 text-right font-medium">{o.margin_percent?.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-[#8888a0]">{o.supplier || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${o.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#232333] text-[#8888a0]'}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}