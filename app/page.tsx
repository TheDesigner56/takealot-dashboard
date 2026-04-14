import { getStats } from '@/lib/db';

export const revalidate = 60;

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="bg-[#16161f] border border-[#232333] rounded-xl p-5 hover:border-indigo-500/30 transition-colors">
      <div className="text-xs text-[#8888a0] uppercase tracking-wider mb-1">{title}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-xs text-[#8888a0] mt-1">{subtitle}</div>}
    </div>
  );
}

export default async function DashboardPage() {
  const stats = await getStats();

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
          value={stats.products.toLocaleString()}
          subtitle="In shadow catalog"
        />
        <StatCard
          title="Categories"
          value={stats.categories.toLocaleString()}
          subtitle="Unique categories"
        />
        <StatCard
          title="Gap Matches"
          value={stats.gaps.toLocaleString()}
          subtitle="Optimization opportunities"
        />
        <StatCard
          title="Relist Opportunities"
          value={stats.opportunities.toLocaleString()}
          subtitle="Actionable listings"
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a href="/products" className="group bg-[#16161f] border border-[#232333] rounded-xl p-5 hover:border-indigo-500/50 transition-all">
          <div className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">Browse Products →</div>
          <p className="text-sm text-[#8888a0] mt-1">{stats.products.toLocaleString()} products in catalog</p>
        </a>
        <a href="/gaps" className="group bg-[#16161f] border border-[#232333] rounded-xl p-5 hover:border-indigo-500/50 transition-all">
          <div className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">Explore Gaps →</div>
          <p className="text-sm text-[#8888a0] mt-1">{stats.gaps} optimization gaps found</p>
        </a>
        <a href="/opportunities" className="group bg-[#16161f] border border-[#232333] rounded-xl p-5 hover:border-indigo-500/50 transition-all">
          <div className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">View Opportunities →</div>
          <p className="text-sm text-[#8888a0] mt-1">{stats.opportunities} relist candidates</p>
        </a>
      </div>
    </div>
  );
}
