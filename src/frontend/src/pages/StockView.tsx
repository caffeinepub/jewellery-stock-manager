import { Boxes, Loader2, Package, Weight } from "lucide-react";
import { useMemo } from "react";
import ReportDownloader from "../components/ReportDownloader";
import StockTable from "../components/StockTable";
import { useStock } from "../hooks/useQueries";

export default function StockView() {
  const { data: items, isLoading: stockLoading } = useStock();

  const liveStock = useMemo(
    () => items?.filter((i) => !i.isSold) ?? [],
    [items],
  );

  // Items = total non-sold order rows (not deduplicated by design code)
  const totalItems = liveStock.length;

  // GW and NW summed from live records.
  // Pieces = sum of item.pieces (each item stores the actual piece count from the scanner)
  const summaryTotals = useMemo(() => {
    const stockGW = liveStock.reduce((s, i) => s + i.grossWeight, 0);
    const stockNW = liveStock.reduce((s, i) => s + i.netWeight, 0);
    const stockPCS = liveStock.reduce((s, i) => s + Number(i.pieces), 0);
    return { gw: stockGW, nw: stockNW, pcs: stockPCS };
  }, [liveStock]);

  const reportData = useMemo(
    () =>
      liveStock.map((item) => ({
        Code: item.code.replace(/#\d+$/, ""),
        GW: item.grossWeight.toFixed(3),
        SW: item.stoneWeight.toFixed(3),
        NW: item.netWeight.toFixed(3),
        PCS: Number(item.pieces),
        Type: item.itemType,
      })),
    [liveStock],
  );

  if (stockLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading stock...</p>
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Items",
            value: totalItems.toString(),
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

      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <StockTable items={liveStock} />
      </div>
    </div>
  );
}
