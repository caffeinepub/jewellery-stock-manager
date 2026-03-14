import { Link, useLocation } from "@tanstack/react-router";
import {
  Boxes,
  Factory,
  Gem,
  LayoutDashboard,
  Package,
  RotateCcw,
  ShoppingCart,
  Users,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/sales", label: "Sales", icon: ShoppingCart },
  { path: "/purchases", label: "Purchases", icon: Package },
  { path: "/returns", label: "Returns", icon: RotateCcw },
  { path: "/stock", label: "Stock", icon: Boxes },
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/factory", label: "Factory", icon: Factory },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-[60]"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #3b0764 100%)",
        }}
      >
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                boxShadow: "0 0 16px rgba(251,191,36,0.5)",
              }}
            >
              <Gem className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white tracking-tight">
                JewelTrack
              </span>
              <span className="ml-2 text-xs text-indigo-300 font-medium hidden sm:inline">
                Inventory & Ledger
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive =
                path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-white/20 text-white shadow-sm backdrop-blur-sm border border-white/25"
                      : "text-indigo-200 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile Nav */}
        <div
          className="md:hidden border-t border-white/10"
          style={{ background: "rgba(0,0,0,0.2)" }}
        >
          <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive =
                path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? "bg-white/20 text-white border border-white/25"
                      : "text-indigo-200 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} JewelTrack</span>
          <span className="flex items-center gap-1">
            Built with <span className="text-destructive">♥</span> using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== "undefined"
                  ? window.location.hostname
                  : "jeweltrack",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
