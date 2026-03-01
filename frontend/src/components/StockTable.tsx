import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { JewelleryItem } from '../backend';

interface StockTableProps {
  items: JewelleryItem[];
  selectable?: boolean;
  selectedCodes?: Set<string>;
  onSelectionChange?: (codes: Set<string>) => void;
}

type SortField = 'code' | 'grossWeight' | 'stoneWeight' | 'netWeight' | 'pieces';
type SortDir = 'asc' | 'desc';

export default function StockTable({
  items,
  selectable = false,
  selectedCodes = new Set(),
  onSelectionChange,
}: StockTableProps) {
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => item.code.toLowerCase().includes(q));
  }, [items, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'code') {
        cmp = a.code.localeCompare(b.code);
      } else if (sortField === 'pieces') {
        cmp = Number(a.pieces) - Number(b.pieces);
      } else {
        cmp = (a[sortField] as number) - (b[sortField] as number);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const handleRowClick = (code: string, e: React.MouseEvent) => {
    if (!selectable || !onSelectionChange) return;
    const next = new Set(selectedCodes);
    if (e.ctrlKey || e.metaKey) {
      if (next.has(code)) next.delete(code);
      else next.add(code);
    } else {
      if (next.has(code) && next.size === 1) next.clear();
      else {
        next.clear();
        next.add(code);
      }
    }
    onSelectionChange(next);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary" />
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <div className="rounded-xl border border-border overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/60 border-b border-border">
                {selectable && (
                  <th className="w-10 px-4 py-3 text-left">
                    <span className="sr-only">Select</span>
                  </th>
                )}
                {(
                  [
                    { field: 'code', label: 'Code', align: 'left' },
                    { field: 'grossWeight', label: 'GW (g)', align: 'right' },
                    { field: 'stoneWeight', label: 'SW (g)', align: 'right' },
                    { field: 'netWeight', label: 'NW (g)', align: 'right' },
                    { field: 'pieces', label: 'PCS', align: 'right' },
                  ] as { field: SortField; label: string; align: string }[]
                ).map(({ field, label, align }) => (
                  <th
                    key={field}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground cursor-pointer select-none ${
                      align === 'right' ? 'text-right' : 'text-left'
                    }`}
                    onClick={() => handleSort(field)}
                  >
                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        align === 'right' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      {label}
                      <SortIcon field={field} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={selectable ? 6 : 5}
                    className="px-4 py-10 text-center text-muted-foreground text-sm"
                  >
                    No items found
                  </td>
                </tr>
              ) : (
                sorted.map((item) => {
                  const isSelected = selectedCodes.has(item.code);
                  return (
                    <tr
                      key={item.code}
                      onClick={(e) => handleRowClick(item.code, e)}
                      className={`transition-colors ${selectable ? 'cursor-pointer' : ''} ${
                        isSelected
                          ? 'bg-primary/10 hover:bg-primary/15'
                          : 'hover:bg-secondary/40'
                      }`}
                    >
                      {selectable && (
                        <td className="px-4 py-3">
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-primary border-primary' : 'border-border'
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-2.5 h-2.5 text-primary-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                        {item.code}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {item.grossWeight.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {item.stoneWeight.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {item.netWeight.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {Number(item.pieces)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {sorted.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {sorted.length} item{sorted.length !== 1 ? 's' : ''}
          {selectable && selectedCodes.size > 0 && (
            <span className="ml-2 text-primary font-medium">
              · {selectedCodes.size} selected
            </span>
          )}
        </p>
      )}
    </div>
  );
}
