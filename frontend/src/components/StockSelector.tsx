import { useState, useMemo } from 'react';
import { Search, ShoppingCart, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import StockTable from './StockTable';
import { JewelleryItem } from '../backend';

interface StockSelectorProps {
  items: JewelleryItem[];
  onSelectionConfirmed: (selectedItems: JewelleryItem[]) => void;
}

export default function StockSelector({ items, onSelectionConfirmed }: StockSelectorProps) {
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const prefixes = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      set.add(item.code.slice(0, 2).toUpperCase());
    }
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => {
      const matchesSearch = item.code.toLowerCase().includes(q);
      const matchesTab =
        activeTab === 'all' || item.code.toUpperCase().startsWith(activeTab);
      return matchesSearch && matchesTab;
    });
  }, [items, search, activeTab]);

  const selectedItems = useMemo(
    () => items.filter((i) => selectedCodes.has(i.code)),
    [items, selectedCodes]
  );

  const totals = useMemo(
    () => ({
      gw: selectedItems.reduce((s, i) => s + i.grossWeight, 0),
      nw: selectedItems.reduce((s, i) => s + i.netWeight, 0),
      pcs: selectedItems.reduce((s, i) => s + Number(i.pieces), 0),
    }),
    [selectedItems]
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-secondary/50 p-1">
          <TabsTrigger value="all" className="text-xs">
            All
          </TabsTrigger>
          {prefixes.map((p) => (
            <TabsTrigger key={p} value={p} className="text-xs font-mono">
              {p}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeTab} className="mt-3">
          <StockTable
            items={filteredItems}
            selectable
            selectedCodes={selectedCodes}
            onSelectionChange={setSelectedCodes}
          />
        </TabsContent>
      </Tabs>

      {selectedCodes.size > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {selectedCodes.size} item{selectedCodes.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{totals.gw.toFixed(3)}g GW</span>
              <span>{totals.nw.toFixed(3)}g NW</span>
              <span>{totals.pcs} pcs</span>
            </div>
          </div>
          <Button onClick={() => onSelectionConfirmed(selectedItems)} className="w-full gap-2">
            <ShoppingCart className="w-4 h-4" />
            Record Entry ({selectedCodes.size} items)
          </Button>
        </div>
      )}
    </div>
  );
}
