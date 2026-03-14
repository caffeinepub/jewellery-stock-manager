import { Boxes, Loader2, Package, Weight } from "lucide-react";
import { useMemo } from "react";
import ReportDownloader from "../components/ReportDownloader";
import StockTable from "../components/StockTable";
import { useAnalytics, useStock } from "../hooks/useQueries";

export default function StockView() {
  const { data: items, isLoading: stockLoading } = useStock();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();

  const isLoading = stockLoading || analyticsLoading;

  const liveStock = useMemo(
    () => items?.filter((i) => !i.isSold) ?? [],
    [items],
  );

  // Summary computed from analytics using the correct formula:
  // Stock = Purchases - Sales - Purchase Returns + Sales Returns
  const summaryTotals = useMemo(() => {
    if (!analytics) {
      return { gw: 0, nw: 0, pcs: 0 };
    }

    const totalWeightPurchased = analytics.purchases.totalWeight ?? 0;
    const totalWeightSold = analytics.sales.totalWeight ?? 0;
    const totalPurchaseReturnWeight =
      analytics.purchaseReturns.totalWeight ?? 0;
    const totalSalesReturnWeight = analytics.salesReturns.totalWeight ?? 0;

    const totalPiecesPurchased = Number(analytics.purchases.totalPieces ?? 0);
    const totalPiecesSold = Number(analytics.sales.totalPieces ?? 0);
    const totalPurchaseReturnPieces = Number(
      analytics.purchaseReturns.totalPieces ?? 0,
    );
    const totalSalesReturnPieces = Number(
      analytics.salesReturns.totalPieces ?? 0,
    );

    // For gross weight, compute from live stock items directly
    const stockGW = liveStock.reduce((s, i) => s + i.grossWeight, 0);
    const stockNW = Math.max(
      0,
      totalWeightPurchased -
        totalWeightSold -
        totalPurchaseReturnWeight +
        totalSalesReturnWeight,
    );
    const stockPCS = Math.max(
      0,
      totalPiecesPurchased -
        totalPiecesSold -
        totalPurchaseReturnPieces +
        totalSalesReturnPieces,
    );

    return { gw: stockGW, nw: stockNW, pcs: stockPCS };
  }, [analytics, liveStock]);

  const reportData = liveStock.map((item) => ({
    Code: item.code,
    GW: item.grossWeight.toFixed(3),
    SW: item.stoneWeight.toFixed(3),
    NW: item.netWeight.toFixed(3),
    PCS: Number(item.pieces),
    Type: item.itemType,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading stock…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Stock View
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live unsold inventory
          </p>
        </div>
        <ReportDownloader data={reportData} filename="stock-report" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Items",
            value: liveStock.length.toString(),
            icon: Boxes,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Gross Weight",
            value: `${summaryTotals.gw.toFixed(3)}g`,
            icon: Weight,
            color: "text-warning",
            bg: "bg-warning/10",
          },
          {
            label: "Net Weight",
            value: `${summaryTotals.nw.toFixed(3)}g`,
            icon: Weight,
            color: "text-success",
            bg: "bg-success/10",
          },
          {
            label: "Pieces",
            value: summaryTotals.pcs.toString(),
            icon: Package,
            color: "text-accent",
            bg: "bg-accent/10",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-2xl p-5 shadow-soft"
          >
            <div
              className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}
            >
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Stock Table */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <StockTable items={liveStock} />
      </div>
    </div>
  );
}
