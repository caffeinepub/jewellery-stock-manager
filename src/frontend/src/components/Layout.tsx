import { Link, useRouterState } from '@tanstack/react-router';
import { LayoutDashboard, ShoppingCart, Package, RotateCcw, Warehouse, Users, Factory, Gem } from 'lucide-react';
import { SiCoffeescript } from 'react-icons/si';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/sales', label: 'Sales', icon: ShoppingCart },
    { path: '/purchases', label: 'Purchases', icon: Package },
    { path: '/returns', label: 'Returns', icon: RotateCcw },
    { path: '/stock', label: 'Stock', icon: Warehouse },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/factory', label: 'Factory', icon: Factory },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700">
              <Gem className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Jewellery Stock Manager</h1>
              <p className="text-xs text-muted-foreground">Precision Inventory Management</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border/40 bg-muted/30">
        <div className="container">
          <div className="flex gap-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30 py-6 mt-12">
        <div className="container">
          <div className="flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Jewellery Stock Manager. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Built with <SiCoffeescript className="h-4 w-4 text-amber-600" /> using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  typeof window !== 'undefined' ? window.location.hostname : 'jewellery-stock-manager'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-amber-600 transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
