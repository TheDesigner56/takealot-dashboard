import { getProductById } from '@/lib/db';
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
    </div>
  );
}
