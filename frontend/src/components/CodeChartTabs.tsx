import { useState, useMemo } from 'react';
import { Package, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JewelleryItem } from '../backend';
import FilteredStockView from './FilteredStockView';

interface CodeChartTabsProps {
  items: JewelleryItem[];
  onSelectionConfirmed: (selectedItems: JewelleryItem[]) => void;
}

export default function CodeChartTabs({ items, onSelectionConfirmed }: CodeChartTabsProps) {
  const [selectedPrefix, setSelectedPrefix] = useState<string | null>(null);
  const [accumulated, setAccumulated] = useState<JewelleryItem[]>([]);

  const prefixes = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const prefix = item.code.slice(0, 2).toUpperCase();
      map.set(prefix, (map.get(prefix) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!selectedPrefix) return [];
    return items.filter((item) => item.code.toUpperCase().startsWith(selectedPrefix));
  }, [items, selectedPrefix]);

  const handleAddToSelection = (codes: Set<string>) => {
    const newItems = items.filter((item) => codes.has(item.code));
    const existingCodes = new Set(accumulated.map((i) => i.code));
    const toAdd = newItems.filter((i) => !existingCodes.has(i.code));
    setAccumulated([...accumulated, ...toAdd]);
    setSelectedPrefix(null);
  };

  const handleRemoveAccumulated = (code: string) => {
    setAccumulated(accumulated.filter((i) => i.code !== code));
  };

  const accTotals = useMemo(
    () => ({
      gw: accumulated.reduce((s, i) => s + i.grossWeight, 0),
      nw: accumulated.reduce((s, i) => s + i.netWeight, 0),
      pcs: accumulated.reduce((s, i) => s + Number(i.pieces), 0),
    }),
    [accumulated]
  );

  if (selectedPrefix) {
    return (
      <FilteredStockView
        items={filteredItems}
        prefix={selectedPrefix}
        onBack={() => setSelectedPrefix(null)}
        onAddToSelection={handleAddToSelection}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Prefix Grid */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Select by Code Prefix
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
          {prefixes.map(([prefix, count]) => (
            <button
              key={prefix}
              onClick={() => setSelectedPrefix(prefix)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-150 group shadow-soft"
            >
              <span className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                {prefix}
              </span>
              <span className="text-xs text-muted-foreground">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accumulated Selection */}
      {accumulated.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Selected Items ({accumulated.length})
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{accTotals.gw.toFixed(3)}g GW</span>
              <span>{accTotals.nw.toFixed(3)}g NW</span>
              <span>{accTotals.pcs} pcs</span>
            </div>
          </div>
          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-secondary/80">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Code
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    GW
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    NW
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    PCS
                  </th>
                  <th className="w-10 px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accumulated.map((item) => (
                  <tr key={item.code} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-2 font-mono text-xs font-medium text-foreground">
                      {item.code}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {item.grossWeight.toFixed(3)}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {item.netWeight.toFixed(3)}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {Number(item.pieces)}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleRemoveAccumulated(item.code)}
                        className="text-muted-foreground hover:text-destructive transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border bg-card">
            <Button
              onClick={() => onSelectionConfirmed(accumulated)}
              className="w-full gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Record Entry ({accumulated.length} items)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
