import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ReportDownloader from './ReportDownloader';
import { TransactionRecord, ItemType } from '../backend';

interface TransactionTotalsViewProps {
  transactions: TransactionRecord[];
  title?: string;
  showReportDownloader?: boolean;
}

function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) / 1_000_000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateKey(timestamp: bigint): string {
  const d = new Date(Number(timestamp) / 1_000_000);
  return d.toISOString().split('T')[0];
}

export default function TransactionTotalsView({
  transactions,
  title,
  showReportDownloader = false,
}: TransactionTotalsViewProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(Number(t.timestamp) / 1_000_000);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
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
    Customer: t.customerName || '',
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {title && (
          <h3 className="font-display font-semibold text-base text-foreground">{title}</h3>
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
        {[
          { label: 'Transactions', value: totals.count.toString() },
          { label: 'Gross Weight', value: `${totals.gw.toFixed(3)}g` },
          { label: 'Net Weight', value: `${totals.nw.toFixed(3)}g` },
          { label: 'Pieces', value: totals.pcs.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 shadow-soft">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-lg font-display font-semibold text-foreground mt-0.5">{value}</p>
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
                  onClick={() => toggleDate(dateKey)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">
                      {formatDate(txns[0].timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{txns.length} items</span>
                    <span>{dayGW.toFixed(3)}g GW</span>
                    <span>{dayPCS} pcs</span>
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-card">
                          <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Code
                          </th>
                          <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Type
                          </th>
                          <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            GW
                          </th>
                          <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            SW
                          </th>
                          <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            NW
                          </th>
                          <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            PCS
                          </th>
                          <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Customer
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {txns.map((t) => (
                          <tr
                            key={Number(t.id)}
                            className={`hover:bg-secondary/30 transition-colors ${
                              t.transactionType === ItemType.sale
                                ? 'border-l-2 border-l-success'
                                : ''
                            }`}
                          >
                            <td className="px-4 py-2.5 font-mono text-xs font-medium text-foreground">
                              {t.item.code}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  t.transactionType === ItemType.sale
                                    ? 'bg-success/10 text-success'
                                    : t.transactionType === ItemType.purchase
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-warning/10 text-warning'
                                }`}
                              >
                                {t.transactionType}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">
                              {t.item.grossWeight.toFixed(3)}
                            </td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">
                              {t.item.stoneWeight.toFixed(3)}
                            </td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">
                              {t.item.netWeight.toFixed(3)}
                            </td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">
                              {Number(t.item.pieces)}
                            </td>
                            <td className="px-4 py-2.5 text-muted-foreground text-xs">
                              {t.customerName || '—'}
                            </td>
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
