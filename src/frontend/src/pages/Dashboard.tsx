import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  Loader2,
  Package,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useAnalytics, useResetAllData } from "../hooks/useQueries";

const cardThemes = {
  stock: {
    gradient: "from-cyan-50 to-teal-100",
    border: "border-teal-200",
    iconBg: "bg-teal-500",
    statBg: "bg-teal-50/80",
    labelColor: "text-teal-700",
    valueColor: "text-teal-900",
    hoverBorder: "hover:border-teal-400",
    titleColor: "text-teal-800",
  },
  sales: {
    gradient: "from-emerald-50 to-green-100",
    border: "border-emerald-200",
    iconBg: "bg-emerald-500",
    statBg: "bg-emerald-50/80",
    labelColor: "text-emerald-700",
    valueColor: "text-emerald-900",
    hoverBorder: "hover:border-emerald-400",
    titleColor: "text-emerald-800",
  },
  purchases: {
    gradient: "from-amber-50 to-orange-100",
    border: "border-amber-200",
    iconBg: "bg-amber-500",
    statBg: "bg-amber-50/80",
    labelColor: "text-amber-700",
    valueColor: "text-amber-900",
    hoverBorder: "hover:border-amber-400",
    titleColor: "text-amber-800",
  },
  purchaseReturns: {
    gradient: "from-rose-50 to-red-100",
    border: "border-rose-200",
    iconBg: "bg-rose-500",
    statBg: "bg-rose-50/80",
    labelColor: "text-rose-700",
    valueColor: "text-rose-900",
    hoverBorder: "hover:border-rose-400",
    titleColor: "text-rose-800",
  },
  salesReturns: {
    gradient: "from-blue-50 to-indigo-100",
    border: "border-blue-200",
    iconBg: "bg-blue-500",
    statBg: "bg-blue-50/80",
    labelColor: "text-blue-700",
    valueColor: "text-blue-900",
    hoverBorder: "hover:border-blue-400",
    titleColor: "text-blue-800",
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: analytics, isLoading, isFetching, refetch } = useAnalytics();
  const resetAllData = useResetAllData();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    refetch();
  };

  const handleReset = async () => {
    await resetAllData.mutateAsync();
    toast.success("All data has been reset");
  };

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

  const currentStockWeight = analytics?.currentStock.totalWeight ?? 0;
  const currentStockPieces = Number(analytics?.currentStock.totalPieces ?? 0);
  const salesWeight = analytics?.sales.totalWeight ?? 0;
  const salesPieces = Number(analytics?.sales.totalPieces ?? 0);
  const purchasesWeight = analytics?.purchases.totalWeight ?? 0;
  const purchasesPieces = Number(analytics?.purchases.totalPieces ?? 0);
  const purchaseReturnsWeight = analytics?.purchaseReturns.totalWeight ?? 0;
  const purchaseReturnsPieces = Number(
    analytics?.purchaseReturns.totalPieces ?? 0,
  );
  const salesReturnsWeight = analytics?.salesReturns.totalWeight ?? 0;
  const salesReturnsPieces = Number(analytics?.salesReturns.totalPieces ?? 0);

  const statCards = [
    {
      label: "Current Stock",
      weight: currentStockWeight,
      pieces: currentStockPieces,
      icon: Boxes,
      theme: cardThemes.stock,
      onClick: () => navigate({ to: "/stock" }),
    },
    {
      label: "Sales",
      weight: salesWeight,
      pieces: salesPieces,
      icon: ShoppingCart,
      theme: cardThemes.sales,
      onClick: () => navigate({ to: "/sales" }),
    },
    {
      label: "Purchases",
      weight: purchasesWeight,
      pieces: purchasesPieces,
      icon: Package,
      theme: cardThemes.purchases,
      onClick: () => navigate({ to: "/purchases" }),
    },
    {
      label: "Purchase Returns",
      weight: purchaseReturnsWeight,
      pieces: purchaseReturnsPieces,
      icon: TrendingDown,
      theme: cardThemes.purchaseReturns,
      onClick: () => navigate({ to: "/returns" }),
    },
    {
      label: "Sales Returns",
      weight: salesReturnsWeight,
      pieces: salesReturnsPieces,
      icon: TrendingUp,
      theme: cardThemes.salesReturns,
      onClick: () => navigate({ to: "/returns" }),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live inventory overview and transaction summary
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-primary/30 bg-card disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statCards.map(
          ({ label, weight, pieces, icon: Icon, theme, onClick }) => (
            <div
              key={label}
              onClick={onClick}
              onKeyDown={(e) => e.key === "Enter" && onClick()}
              className={`bg-gradient-to-br ${theme.gradient} border ${theme.border} ${theme.hoverBorder} rounded-2xl p-5 shadow-soft transition-all duration-200 cursor-pointer hover:shadow-medium hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-xl ${theme.iconBg} flex items-center justify-center shadow-md`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 opacity-60" />
              </div>
              <p className={`text-sm font-semibold ${theme.titleColor} mb-4`}>
                {label}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className={`${theme.statBg} rounded-xl p-3`}>
                  <p
                    className={`text-[11px] font-medium ${theme.labelColor} uppercase tracking-wide mb-1`}
                  >
                    Total Weight
                  </p>
                  <p
                    className={`text-lg font-display font-bold ${theme.valueColor} leading-tight`}
                  >
                    {weight.toFixed(3)}g
                  </p>
                </div>
                <div className={`${theme.statBg} rounded-xl p-3`}>
                  <p
                    className={`text-[11px] font-medium ${theme.labelColor} uppercase tracking-wide mb-1`}
                  >
                    Total Pieces
                  </p>
                  <p
                    className={`text-lg font-display font-bold ${theme.valueColor} leading-tight`}
                  >
                    {pieces.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display font-semibold text-base text-foreground mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "New Sale",
              path: "/sales",
              icon: ShoppingCart,
              iconBg: "bg-emerald-500",
              cardBg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
              labelColor: "text-emerald-800",
            },
            {
              label: "New Purchase",
              path: "/purchases",
              icon: Package,
              iconBg: "bg-amber-500",
              cardBg: "bg-amber-50 hover:bg-amber-100 border-amber-200",
              labelColor: "text-amber-800",
            },
            {
              label: "Process Return",
              path: "/returns",
              icon: RotateCcw,
              iconBg: "bg-rose-500",
              cardBg: "bg-rose-50 hover:bg-rose-100 border-rose-200",
              labelColor: "text-rose-800",
            },
            {
              label: "View Stock",
              path: "/stock",
              icon: Boxes,
              iconBg: "bg-indigo-500",
              cardBg: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200",
              labelColor: "text-indigo-800",
            },
          ].map(({ label, path, icon: Icon, iconBg, cardBg, labelColor }) => (
            <button
              type="button"
              key={label}
              onClick={() => navigate({ to: path })}
              className={`flex items-center gap-3 p-4 rounded-xl border ${cardBg} transition-all duration-150 text-left group shadow-soft hover:shadow-medium hover:-translate-y-0.5`}
            >
              <div
                className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className={`text-sm font-medium ${labelColor}`}>
                {label}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* Danger Zone — Reset Data */}
      <div className="border border-red-200 bg-red-50/50 rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-display font-semibold text-sm text-red-800">
              Danger Zone
            </h3>
            <p className="text-xs text-red-600 mt-0.5">
              Permanently delete all items, transactions and customers.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                data-ocid="dashboard.reset_data_button"
                disabled={resetAllData.isPending}
              >
                {resetAllData.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Reset Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset All Data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete ALL items, transactions, and
                  customers across all tabs. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="dashboard.cancel_button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-ocid="dashboard.confirm_button"
                >
                  Yes, Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
