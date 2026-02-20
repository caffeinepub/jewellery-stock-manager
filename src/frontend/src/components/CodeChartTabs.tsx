import { useState, useMemo } from 'react';
import { useAvailableStock } from '../hooks/useQueries';
import { ItemType, JewelleryItem } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';
import FilteredStockView from './FilteredStockView';
import type { ParsedItem } from '../utils/scannerParser';

interface CodeChartTabsProps {
  transactionType: ItemType;
  onSelectionComplete: (items: ParsedItem[]) => void;
}

export default function CodeChartTabs({ transactionType, onSelectionComplete }: CodeChartTabsProps) {
  const { data: availableStock, isLoading } = useAvailableStock(transactionType);
  const [selectedCodePrefix, setSelectedCodePrefix] = useState<string | null>(null);
  const [accumulatedItems, setAccumulatedItems] = useState<JewelleryItem[]>([]);

  // Group items by CODE prefix (first 2 characters)
  const groupedByPrefix = useMemo(() => {
    if (!availableStock) return {};

    const groups: Record<string, JewelleryItem[]> = {};
    availableStock.forEach((item) => {
      const prefix = item.code.substring(0, 2).toUpperCase();
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix].push(item);
    });

    return groups;
  }, [availableStock]);

  const prefixes = Object.keys(groupedByPrefix).sort();

  const handlePrefixClick = (prefix: string) => {
    setSelectedCodePrefix(prefix);
  };

  const handleBack = () => {
    setSelectedCodePrefix(null);
  };

  const handleAddToSelection = (selectedItems: JewelleryItem[]) => {
    // Add to accumulated items
    const newAccumulated = [...accumulatedItems, ...selectedItems];
    setAccumulatedItems(newAccumulated);
    setSelectedCodePrefix(null);
  };

  const handleRecordEntry = () => {
    // Convert JewelleryItem to ParsedItem format
    const parsedItems: ParsedItem[] = accumulatedItems.map((item) => ({
      code: item.code,
      grossWeight: item.grossWeight,
      stoneWeight: item.stoneWeight,
      netWeight: item.netWeight,
      pieces: Number(item.pieces),
      status: 'VALID' as const,
    }));

    onSelectionComplete(parsedItems);
    setAccumulatedItems([]);
  };

  const handleClearSelection = () => {
    setAccumulatedItems([]);
  };

  if (isLoading) {
    return (
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="text-xl font-display">Select Items from Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedCodePrefix) {
    return (
      <FilteredStockView
        items={groupedByPrefix[selectedCodePrefix] || []}
        codePrefix={selectedCodePrefix}
        onBack={handleBack}
        onAddToSelection={handleAddToSelection}
      />
    );
  }

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="text-xl font-display">Select Items from Stock</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* CODE Prefix Tabs - Compact for mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {prefixes.map((prefix) => {
            const count = groupedByPrefix[prefix].length;
            const totalGW = groupedByPrefix[prefix].reduce((sum, item) => sum + item.grossWeight, 0);

            return (
              <Button
                key={prefix}
                variant="outline"
                onClick={() => handlePrefixClick(prefix)}
                className="h-auto py-4 px-3 flex flex-col items-start gap-2 hover:shadow-medium transition-all duration-200 rounded-xl"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg font-bold font-mono text-primary">{prefix}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-xs text-left text-muted-foreground space-y-0.5">
                  <div>{count} items</div>
                  <div>{totalGW.toFixed(1)}g</div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Accumulated Selection Summary */}
        {accumulatedItems.length > 0 && (
          <div className="p-6 rounded-xl bg-primary/5 border-2 border-primary/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Selected Items</h3>
                <p className="text-sm text-muted-foreground">
                  {accumulatedItems.length} items • Total GW:{' '}
                  {accumulatedItems.reduce((sum, item) => sum + item.grossWeight, 0).toFixed(2)}g
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                Clear
              </Button>
            </div>
            <Button onClick={handleRecordEntry} className="w-full shadow-soft">
              Record Entry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
