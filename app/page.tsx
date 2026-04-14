import { getStats } from '@/lib/db';

export const revalidate = 60; // revalidate every minute

function StatCard({ title, value, subtitle, trend }: { title: string; value: string | number; subtitle?: string; trend?: string }) {
  return (
    <div className="bg-[#16161f] border border-[#232333] rounded-xl p-5 hover:border-indigo-500/30 transition-colors">
      <div className="text-xs text-[#8888a0] uppercase tracking-wider mb-1">{title}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-xs text-[#8888a0] mt-1">{subtitle}</div>}
      {trend && <div className="text-xs text-emerald-400 mt-1">{trend}</div>}
    </div>
  );
}

function CategoryBar({ category, count, max }: { category: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="w-28 text-xs text-[#8888a0] truncate" title={category}>{category}</div>
      <div className="flex-1 bg-[#232333] rounded-full h-2 overflow-hidden">
        <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-[#8888a0] w-10 text-right">{count}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const stats = await getStats();
  const maxCatCount = stats.topCategories.length > 0 ? stats.topCategories[0].count : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Intelligence Dashboard</h1>
          <p className="text-sm text-[#8888a0] mt-1">Shadow catalog analysis & opportunity tracking</p>
        </div>
        <div className="text-xs text-[#8888a0]">
          Last refreshed: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Products Tracked"
          value={stats.totalProducts.toLocaleString()}
          subtitle={`${stats.recentDiscovered} discovered last 7 days`}
        />
        <StatCard
          title="Gap Matches"
          value={stats.totalGaps.toLocaleString()}
          subtitle="Optimization opportunities"
        />
        <StatCard
          title="Relist Opportunities"
          value={stats.totalOpportunities.toLocaleString()}
          subtitle="Actionable listings"
        />
        <StatCard
          title="Avg Margin"
          value={`${stats.avgMargin}%`}
          trend={stats.avgMargin > 20 ? 'Above target' : 'Below target'}
        />
      </div>

      {/* Price Range + Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Price Distribution */}
        <div className="bg-[#16161f] border border-[#232333] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Price Distribution</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#8888a0]">Min Price</span>
              <span className="text-white font-medium">R{stats.priceRange.min.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8888a0]">Average Price</span>
              <span className="text-white font-medium">R{stats.priceRange.avg.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8888a0]">Max Price</span>
              <span className="text-white font-medium">R{stats.priceRange.max.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-[#16161f] border border-[#232333] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Top Categories</h2>
          {stats.topCategories.map((cat) => (
            <CategoryBar key={cat.category} category={cat.category} count={cat.count} max={maxCatCount} />
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a href="/products" className="group bg-[#16161f] border border-[#232333] rounded-xl p-5 hover:border-indigo-500/50 transition-all">
          <div className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">Browse Products →</div>
          <p className="text-sm text-[#8888a0] mt-1">{stats.totalProducts.toLocaleString()} products in catalog</p>
        </a>
        <a href="/gaps" className="group bg-[#16161f] border border-[#232333] rounded-xl p-5 hover:border-indigo-500/50 transition-all">
          <div className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">Explore Gaps →</div>
          <p className="text-sm text-[#8888a0] mt-1">{stats.totalGaps} optimization gaps found</p>
        </a>
        <a href="/opportunities" className="group bg-[#16161f] border border-[#232333] rounded-xl p-5 hover:border-indigo-500/50 transition-all">
          <div className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">View Opportunities →</div>
          <p className="text-sm text-[#8888a0] mt-1">{stats.totalOpportunities} relist candidates</p>
        </a>
      </div>
    </div>
  );
}