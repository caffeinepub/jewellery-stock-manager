import { Boxes, Loader2, Package, Weight } from "lucide-react";
import { useMemo } from "react";
import { ItemType } from "../backend";
import ReportDownloader from "../components/ReportDownloader";
import StockTable from "../components/StockTable";
import { useStock, useTransactionsByType } from "../hooks/useQueries";

export default function StockView() {
  const { data: items, isLoading: stockLoading } = useStock();
  const { data: purchaseTx } = useTransactionsByType(ItemType.purchase);
  const { data: saleTx } = useTransactionsByType(ItemType.sale);
  const { data: purchaseReturnTx } = useTransactionsByType(
    ItemType.purchaseReturn,
  );
  const { data: salesReturnTx } = useTransactionsByType(ItemType.salesReturn);

  const liveStock = useMemo(
    () => items?.filter((i) => !i.isSold) ?? [],
    [items],
  );

  // Summary numbers use the transaction formula:
  // Stock = Purchases − Sales − Purchase Returns + Sales Returns
  // Use t.item.grossWeight / t.item.netWeight for consistency —
  // both come from the same JewelleryItem stored at transaction time.
  const summaryTotals = useMemo(() => {
    const gwSum = (txs: typeof purchaseTx) =>
      (txs ?? []).reduce((s, t) => s + t.item.grossWeight, 0);
    const nwSum = (txs: typeof purchaseTx) =>
      (txs ?? []).reduce((s, t) => s + t.item.netWeight, 0);
    const pcsSum = (txs: typeof purchaseTx) =>
      (txs ?? []).reduce((s, t) => s + Number(t.quantity), 0);
    const itemCount = (txs: typeof purchaseTx) => (txs ?? []).length;

    const gw =
      gwSum(purchaseTx) -
      gwSum(saleTx) -
      gwSum(purchaseReturnTx) +
      gwSum(salesReturnTx);
    const nw =
      nwSum(purchaseTx) -
      nwSum(saleTx) -
      nwSum(purchaseReturnTx) +
      nwSum(salesReturnTx);
    const pcs =
      pcsSum(purchaseTx) -
      pcsSum(saleTx) -
      pcsSum(purchaseReturnTx) +
      pcsSum(salesReturnTx);
    const count =
      itemCount(purchaseTx) -
      itemCount(saleTx) -
      itemCount(purchaseReturnTx) +
      itemCount(salesReturnTx);

    return {
      gw: Math.max(0, gw),
      nw: Math.max(0, nw),
      pcs: Math.max(0, pcs),
      count: Math.max(0, count),
    };
  }, [purchaseTx, saleTx, purchaseReturnTx, salesReturnTx]);

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
            value: summaryTotals.count.toString(),
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
