import { useState, useMemo } from 'react';
import { useAvailableStock } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ItemType, JewelleryItem } from '../backend';
import type { ParsedItem } from '../utils/scannerParser';
import { Skeleton } from '@/components/ui/skeleton';
import FilteredStockView from './FilteredStockView';

interface CodeChartTabsProps {
  transactionType: ItemType;
  onSelectionComplete: (items: ParsedItem[]) => void;
  isSalesReturn?: boolean;
}

const CHART_COLORS = [
  'bg-blue-500 hover:bg-blue-600 border-blue-600',
  'bg-green-500 hover:bg-green-600 border-green-600',
  'bg-purple-500 hover:bg-purple-600 border-purple-600',
  'bg-orange-500 hover:bg-orange-600 border-orange-600',
  'bg-pink-500 hover:bg-pink-600 border-pink-600',
  'bg-teal-500 hover:bg-teal-600 border-teal-600',
  'bg-indigo-500 hover:bg-indigo-600 border-indigo-600',
  'bg-amber-500 hover:bg-amber-600 border-amber-600',
  'bg-cyan-500 hover:bg-cyan-600 border-cyan-600',
  'bg-rose-500 hover:bg-rose-600 border-rose-600',
];

export default function CodeChartTabs({ transactionType, onSelectionComplete, isSalesReturn }: CodeChartTabsProps) {
  const { data: stockItems, isLoading } = useAvailableStock(transactionType);
  const [selectedCodePrefix, setSelectedCodePrefix] = useState<string | null>(null);
  const [accumulatedSelections, setAccumulatedSelections] = useState<Map<string, ParsedItem>>(new Map());

  // Extract CODE prefixes
  const codePrefixes = useMemo(() => {
    if (!stockItems) return [];
    const prefixes = new Set<string>();
    stockItems.forEach((item) => {
      const match = item.code.match(/^([A-Z]+)/);
      if (match) {
        prefixes.add(match[1]);
      }
    });
    return Array.from(prefixes).sort();
  }, [stockItems]);

  // Group items by prefix
  const itemsByPrefix = useMemo(() => {
    const groups: Record<string, JewelleryItem[]> = {};
    if (!stockItems) return groups;
    
    stockItems.forEach((item) => {
      const match = item.code.match(/^([A-Z]+)/);
      const prefix = match ? match[1] : 'OTHER';
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix].push(item);
    });
    return groups;
  }, [stockItems]);

  const handleCodeTabClick = (prefix: string) => {
    setSelectedCodePrefix(prefix);
  };

  const handleBackToChart = () => {
    setSelectedCodePrefix(null);
  };

  const handleSelectionFromCode = (items: ParsedItem[]) => {
    // Accumulate selections from this CODE prefix
    const newAccumulated = new Map(accumulatedSelections);
    items.forEach((item) => {
      newAccumulated.set(item.code, item);
    });
    setAccumulatedSelections(newAccumulated);
    
    // Go back to chart view
    setSelectedCodePrefix(null);
  };

  const handleRecordEntry = () => {
    const allItems = Array.from(accumulatedSelections.values());
    onSelectionComplete(allItems);
    setAccumulatedSelections(new Map());
  };

  const getTitle = () => {
    if (isSalesReturn) return 'Select Items for Sales Return';
    return transactionType === ItemType.sale ? 'Select Items for Sale' : 'Select Items';
  };

  // If a CODE prefix is selected, show filtered view
  if (selectedCodePrefix) {
    const filteredItems = itemsByPrefix[selectedCodePrefix] || [];
    return (
      <FilteredStockView
        items={filteredItems}
        codePrefix={selectedCodePrefix}
        onBack={handleBackToChart}
        onSelectionComplete={handleSelectionFromCode}
        existingSelections={accumulatedSelections}
      />
    );
  }

  // Otherwise show chart tabs overview
  return (
    <Card>
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Record Entry Button */}
        {accumulatedSelections.size > 0 && (
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
            <span className="text-sm font-medium">
              {accumulatedSelections.size} item{accumulatedSelections.size !== 1 ? 's' : ''} selected
            </span>
            <Button onClick={handleRecordEntry} size="lg">
              Record Entry ({accumulatedSelections.size})
            </Button>
          </div>
        )}

        {/* Chart Tabs */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : codePrefixes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No stock items available
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {codePrefixes.map((prefix, index) => {
              const colorClass = CHART_COLORS[index % CHART_COLORS.length];
              const itemCount = itemsByPrefix[prefix]?.length || 0;
              const selectedCount = Array.from(accumulatedSelections.values()).filter(
                (item) => item.code.startsWith(prefix)
              ).length;

              return (
                <button
                  key={prefix}
                  onClick={() => handleCodeTabClick(prefix)}
                  className={`relative flex flex-col items-center justify-center p-6 rounded-lg border-2 text-white transition-all ${colorClass} shadow-md hover:shadow-lg`}
                >
                  <div className="text-2xl font-bold mb-1">{prefix}</div>
                  <div className="text-sm opacity-90">{itemCount} items</div>
                  {selectedCount > 0 && (
                    <div className="absolute top-2 right-2 bg-white text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {selectedCount}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
