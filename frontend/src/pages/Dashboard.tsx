import { useNavigate } from '@tanstack/react-router';
import { Package, ShoppingCart, RotateCcw, Boxes, ArrowRight, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { useAnalytics } from '../hooks/useQueries';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // Purchases
  const totalPiecesPurchased = Number(analytics?.totalPiecesPurchased ?? 0);
  const totalWeightPurchased = analytics?.totalWeightPurchased ?? 0;

  // Sales
  const totalPiecesSold = Number(analytics?.totalPiecesSold ?? 0);
  const totalWeightSold = analytics?.totalWeightSold ?? 0;

  // Purchase Returns
  const totalPurchaseReturnPieces = Number(analytics?.totalPurchaseReturnPieceCount ?? 0);
  const totalPurchaseReturnWeight = analytics?.totalPurchaseReturnWeight ?? 0;

  // Sales Returns
  const totalSalesReturnPieces = Number(analytics?.totalSalesReturnPieceCount ?? 0);
  const totalSalesReturnWeight = analytics?.totalSalesReturnWeight ?? 0;

  // Current Stock formula: Purchases - Sales - Purchase Returns + Sales Returns
  const currentStockPieces = Math.max(
    0,
    totalPiecesPurchased - totalPiecesSold - totalPurchaseReturnPieces + totalSalesReturnPieces
  );
  const currentStockWeight = Math.max(
    0,
    totalWeightPurchased - totalWeightSold - totalPurchaseReturnWeight + totalSalesReturnWeight
  );

  const statCards = [
    {
      label: 'Current Stock',
      weight: currentStockWeight,
      pieces: currentStockPieces,
      icon: Boxes,
      color: 'text-accent',
      bg: 'bg-accent/10',
      onClick: () => navigate({ to: '/stock' }),
    },
    {
      label: 'Sales',
      weight: totalWeightSold,
      pieces: totalPiecesSold,
      icon: ShoppingCart,
      color: 'text-success',
      bg: 'bg-success/10',
      onClick: () => navigate({ to: '/sales' }),
    },
    {
      label: 'Purchases',
      weight: totalWeightPurchased,
      pieces: totalPiecesPurchased,
      icon: Package,
      color: 'text-warning',
      bg: 'bg-warning/10',
      onClick: () => navigate({ to: '/purchases' }),
    },
    {
      label: 'Purchase Returns',
      weight: totalPurchaseReturnWeight,
      pieces: totalPurchaseReturnPieces,
      icon: TrendingDown,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      onClick: () => navigate({ to: '/returns' }),
    },
    {
      label: 'Sales Returns',
      weight: totalSalesReturnWeight,
      pieces: totalSalesReturnPieces,
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10',
      onClick: () => navigate({ to: '/returns' }),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live inventory overview and transaction summary
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statCards.map(({ label, weight, pieces, icon: Icon, color, bg, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            className="bg-card border border-border rounded-2xl p-5 shadow-soft transition-all duration-200 cursor-pointer hover:shadow-medium hover:border-primary/30 hover:-translate-y-0.5"
          >
            {/* Card header */}
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-40" />
            </div>

            {/* Card title */}
            <p className="text-sm font-semibold text-foreground mb-4">{label}</p>

            {/* Equal-sized stats side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Total Weight
                </p>
                <p className="text-lg font-display font-bold text-foreground leading-tight">
                  {weight.toFixed(3)}g
                </p>
              </div>
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Total Pieces
                </p>
                <p className="text-lg font-display font-bold text-foreground leading-tight">
                  {pieces.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display font-semibold text-base text-foreground mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'New Sale',
              path: '/sales',
              icon: ShoppingCart,
              color: 'text-success',
              bg: 'bg-success/10 hover:bg-success/20',
            },
            {
              label: 'New Purchase',
              path: '/purchases',
              icon: Package,
              color: 'text-warning',
              bg: 'bg-warning/10 hover:bg-warning/20',
            },
            {
              label: 'Process Return',
              path: '/returns',
              icon: RotateCcw,
              color: 'text-destructive',
              bg: 'bg-destructive/10 hover:bg-destructive/20',
            },
            {
              label: 'View Stock',
              path: '/stock',
              icon: Boxes,
              color: 'text-primary',
              bg: 'bg-primary/10 hover:bg-primary/20',
            },
          ].map(({ label, path, icon: Icon, color, bg }) => (
            <button
              key={label}
              onClick={() => navigate({ to: path })}
              className={`flex items-center gap-3 p-4 rounded-xl border border-border ${bg} transition-all duration-150 text-left group`}
            >
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-sm font-medium text-foreground">{label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
