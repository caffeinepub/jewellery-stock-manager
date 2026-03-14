import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, ChevronDown, ChevronRight, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { ItemType, type TransactionRecord } from "../backend";
import ReportDownloader from "./ReportDownloader";

type ColorTheme = "green" | "amber" | "rose" | "blue" | "violet";

interface TransactionTotalsViewProps {
  transactions: TransactionRecord[];
  title?: string;
  showReportDownloader?: boolean;
  colorTheme?: ColorTheme;
  hideCustomer?: boolean;
}

const themeStyles: Record<
  ColorTheme,
  {
    cardBg: string;
    labelColor: string;
    valueColor: string;
    evenRow: string;
    headerBg: string;
    headerText: string;
  }
> = {
  green: {
    cardBg: "bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200",
    labelColor: "text-emerald-700",
    valueColor: "text-emerald-900",
    evenRow: "bg-emerald-50/40",
    headerBg: "bg-emerald-500/10",
    headerText: "text-emerald-800",
  },
  amber: {
    cardBg: "bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200",
    labelColor: "text-amber-700",
    valueColor: "text-amber-900",
    evenRow: "bg-amber-50/40",
    headerBg: "bg-amber-500/10",
    headerText: "text-amber-800",
  },
  rose: {
    cardBg: "bg-gradient-to-br from-rose-50 to-red-100 border-rose-200",
    labelColor: "text-rose-700",
    valueColor: "text-rose-900",
    evenRow: "bg-rose-50/40",
    headerBg: "bg-rose-500/10",
    headerText: "text-rose-800",
  },
  blue: {
    cardBg: "bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200",
    labelColor: "text-blue-700",
    valueColor: "text-blue-900",
    evenRow: "bg-blue-50/40",
    headerBg: "bg-blue-500/10",
    headerText: "text-blue-800",
  },
  violet: {
    cardBg: "bg-gradient-to-br from-violet-50 to-purple-100 border-violet-200",
    labelColor: "text-violet-700",
    valueColor: "text-violet-900",
    evenRow: "bg-violet-50/40",
    headerBg: "bg-violet-500/10",
    headerText: "text-violet-800",
  },
};

const defaultTheme = {
  cardBg: "bg-card border-border",
  labelColor: "text-muted-foreground",
  valueColor: "text-foreground",
  evenRow: "bg-secondary/20",
  headerBg: "bg-secondary/50",
  headerText: "text-muted-foreground",
};

function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) / 1_000_000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateKey(timestamp: bigint): string {
  const d = new Date(Number(timestamp) / 1_000_000);
  return d.toISOString().split("T")[0];
}

export default function TransactionTotalsView({
  transactions,
  title,
  showReportDownloader = false,
  colorTheme,
  hideCustomer = false,
}: TransactionTotalsViewProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  const theme = colorTheme ? themeStyles[colorTheme] : defaultTheme;

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(Number(t.timestamp) / 1_000_000);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(`${endDate}T23:59:59`)) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  const grouped = useMemo(() => {
    const map = new Map<string, TransactionRecord[]>();
    for (const t of filtered) {
      const key = formatDateKey(t.timestamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const totals = useMemo(() => {
    const gw = filtered.reduce((s, t) => s + t.item.grossWeight, 0);
    const nw = filtered.reduce((s, t) => s + t.item.netWeight, 0);
    const pcs = filtered.reduce((s, t) => s + Number(t.item.pieces), 0);
    return { gw, nw, pcs, count: filtered.length };
  }, [filtered]);

  const toggleDate = (key: string) => {
    const next = new Set(collapsedDates);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setCollapsedDates(next);
  };

  const reportData = filtered.map((t) => ({
    Date: formatDate(t.timestamp),
    Code: t.item.code,
    Type: t.transactionType,
    GW: t.item.grossWeight.toFixed(3),
    SW: t.item.stoneWeight.toFixed(3),
    NW: t.item.netWeight.toFixed(3),
    PCS: Number(t.item.pieces),
    Customer: t.customerName || "",
  }));

  const summaryCards = [
    { label: "Transactions", value: totals.count.toString() },
    { label: "Gross Weight", value: `${totals.gw.toFixed(3)}g` },
    { label: "Net Weight", value: `${totals.nw.toFixed(3)}g` },
    { label: "Pieces", value: totals.pcs.toString() },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {title && (
          <h3 className="font-display font-semibold text-base text-foreground">
            {title}
          </h3>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs w-36"
            />
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-xs w-36"
            />
          </div>
          {showReportDownloader && (
            <ReportDownloader data={reportData} filename="transactions" />
          )}
        </div>
      </div>

      {/* Summary Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map(({ label, value }) => (
          <div
            key={label}
            className={`border rounded-xl p-3 shadow-soft ${theme.cardBg}`}
          >
            <p className={`text-xs font-medium ${theme.labelColor}`}>{label}</p>
            <p
              className={`text-lg font-display font-semibold ${theme.valueColor} mt-0.5`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Grouped Transactions */}
      {grouped.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No transactions found
        </div>
      ) : (
        <div className="space-y-2">
          {grouped.map(([dateKey, txns]) => {
            const isCollapsed = collapsedDates.has(dateKey);
            const dayGW = txns.reduce((s, t) => s + t.item.grossWeight, 0);
            const dayPCS = txns.reduce((s, t) => s + Number(t.item.pieces), 0);

            return (
              <div
                key={dateKey}
                className="rounded-xl border border-border overflow-hidden shadow-soft"
              >
                <button
                  type="button"
                  onClick={() => toggleDate(dateKey)}
                  className={`w-full flex items-center justify-between px-4 py-3 ${theme.headerBg} hover:opacity-90 transition-colors`}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span
                      className={`text-sm font-semibold ${theme.headerText}`}
                    >
                      {formatDate(txns[0].timestamp)}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-4 text-xs ${theme.labelColor}`}
                  >
                    <span>{txns.length} items</span>
                    <span>{dayGW.toFixed(3)}g GW</span>
                    <span>{dayPCS} pcs</span>
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr
                          className={`border-b border-border ${theme.headerBg}`}
                        >
                          <th
                            className={`text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide ${theme.headerText}`}
                          >
                            Code
                          </th>
                          <th
                            className={`text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide ${theme.headerText}`}
                          >
                            Type
                          </th>
                          <th
                            className={`text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide ${theme.headerText}`}
                          >
                            GW
                          </th>
                          <th
                            className={`text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide ${theme.headerText}`}
                          >
                            SW
                          </th>
                          <th
                            className={`text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide ${theme.headerText}`}
                          >
                            NW
                          </th>
                          <th
                            className={`text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide ${theme.headerText}`}
                          >
                            PCS
                          </th>
                          {!hideCustomer && (
                            <th
                              className={`text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide ${theme.headerText}`}
                            >
                              Customer
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {txns.map((t, rowIdx) => (
                          <tr
                            key={Number(t.id)}
                            className={`hover:bg-secondary/30 transition-colors ${
                              rowIdx % 2 === 0 ? theme.evenRow : ""
                            } ${
                              t.transactionType === ItemType.sale
                                ? "border-l-2 border-l-success"
                                : ""
                            }`}
                          >
                            <td className="px-4 py-2.5 font-mono text-xs font-medium text-foreground">
                              {t.item.code}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  t.transactionType === ItemType.sale
                                    ? "bg-success/10 text-success"
                                    : t.transactionType === ItemType.purchase
                                      ? "bg-primary/10 text-primary"
                                      : "bg-warning/10 text-warning"
                                }`}
                              >
                                {t.transactionType}
                              </span>
                            </td>
                            <td
                              className={`px-4 py-2.5 text-right ${theme.valueColor}`}
                            >
                              {t.item.grossWeight.toFixed(3)}
                            </td>
                            <td
                              className={`px-4 py-2.5 text-right ${theme.labelColor}`}
                            >
                              {t.item.stoneWeight.toFixed(3)}
                            </td>
                            <td
                              className={`px-4 py-2.5 text-right ${theme.labelColor}`}
                            >
                              {t.item.netWeight.toFixed(3)}
                            </td>
                            <td
                              className={`px-4 py-2.5 text-right ${theme.labelColor}`}
                            >
                              {Number(t.item.pieces)}
                            </td>
                            {!hideCustomer && (
                              <td className="px-4 py-2.5 text-muted-foreground text-xs">
                                {t.customerName || "—"}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
