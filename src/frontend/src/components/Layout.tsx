import { Link, useLocation } from '@tanstack/react-router';
import { Home, ShoppingCart, Package, RotateCcw, Warehouse, Users, Factory, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/sales', label: 'Sales', icon: ShoppingCart },
    { to: '/purchases', label: 'Purchases', icon: Package },
    { to: '/returns', label: 'Returns', icon: RotateCcw },
    { to: '/stock', label: 'Stock', icon: Warehouse },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/factory', label: 'Factory', icon: Factory },
  ];

  const currentYear = new Date().getFullYear();
  const appIdentifier = encodeURIComponent(window.location.hostname || 'jewellery-app');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-soft">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-medium">
              <Warehouse className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-display">
              Jewellery Manager
            </h1>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="sticky top-16 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-soft">
        <div className="container px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'gap-2 whitespace-nowrap transition-all duration-200 rounded-lg',
                      isActive && 'shadow-soft'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-16">
        <div className="container px-4 py-8">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Jewellery Manager. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Built with <Heart className="h-4 w-4 text-destructive fill-destructive" /> using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline transition-colors duration-200"
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
