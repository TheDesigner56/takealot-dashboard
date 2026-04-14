import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Takealot Intelligence Dashboard',
  description: 'Shadow catalog analysis, gap discovery, and relist opportunity tracking',
};

function Nav() {
  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/products', label: 'Products' },
    { href: '/gaps', label: 'Gaps' },
    { href: '/opportunities', label: 'Opportunities' },
  ];
  return (
    <nav className="border-b border-[#232333] bg-[#111118]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <a href="/" className="text-lg font-bold text-white tracking-tight">
              <span className="text-indigo-400">T</span>akealot<span className="text-indigo-400">.</span>intel
            </a>
            <div className="hidden sm:flex items-center gap-1">
              {links.map(l => (
                <a key={l.href} href={l.href} className="px-3 py-1.5 text-sm text-[#8888a0] hover:text-white hover:bg-[#232333] rounded-md transition-colors">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div className="text-xs text-[#8888a0]">
            Shadow Catalog Analysis
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0f] text-[#e4e4ef] antialiased">
        <Nav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}