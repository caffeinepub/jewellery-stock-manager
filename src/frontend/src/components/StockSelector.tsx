import { useState, useMemo } from 'react';
import { useStock } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, CheckSquare, Square } from 'lucide-react';
import { ItemType } from '../backend';
import type { ParsedItem } from '../utils/scannerParser';
import { Skeleton } from '@/components/ui/skeleton';

interface StockSelectorProps {
  transactionType: ItemType;
  onSelectionComplete: (items: ParsedItem[]) => void;
  isSalesReturn?: boolean;
}

export default function StockSelector({ transactionType, onSelectionComplete, isSalesReturn }: StockSelectorProps) {
  const { data: stockItems, isLoading } = useStock();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Extract CODE prefixes (alphabetic part)
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

  // Filter items by search term
  const filteredItems = useMemo(() => {
    if (!stockItems) return [];
    if (!searchTerm) return stockItems;
    return stockItems.filter((item) =>
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stockItems, searchTerm]);

  // Group items by prefix
  const itemsByPrefix = useMemo(() => {
    const groups: Record<string, typeof stockItems> = {};
    filteredItems.forEach((item) => {
      const match = item.code.match(/^([A-Z]+)/);
      const prefix = match ? match[1] : 'OTHER';
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix].push(item);
    });
    return groups;
  }, [filteredItems]);

  const toggleItem = (code: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedItems(newSelected);
  };

  const handleRecordEntry = () => {
    if (!stockItems) return;

    const selectedStockItems = stockItems.filter((item) => selectedItems.has(item.code));
    const parsedItems: ParsedItem[] = selectedStockItems.map((item) => ({
      code: item.code,
      grossWeight: item.grossWeight,
      stoneWeight: item.stoneWeight,
      netWeight: item.netWeight,
      pieces: Number(item.pieces),
      status: 'VALID' as const,
    }));

    onSelectionComplete(parsedItems);
    setSelectedItems(new Set());
  };

  const getTitle = () => {
    if (isSalesReturn) {
      return 'Select Items for Sales Return';
    }
    return transactionType === ItemType.sale ? 'Select Items for Sale' : 'Select Items';
  };

  const getDescription = () => {
    if (isSalesReturn) {
      return 'Browse current stock and select items to return from customer';
    }
    return 'Browse current stock and select items for this transaction';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by CODE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Record Entry Button */}
        {selectedItems.size > 0 && (
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
            <span className="text-sm font-medium">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <Button onClick={handleRecordEntry}>
              Record Entry ({selectedItems.size})
            </Button>
          </div>
        )}

        {/* Tabs by Prefix */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : codePrefixes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No stock items available
          </p>
        ) : (
          <Tabs defaultValue={codePrefixes[0]} className="w-full">
            <TabsList className="w-full flex-wrap h-auto">
              {codePrefixes.map((prefix) => (
                <TabsTrigger key={prefix} value={prefix}>
                  {prefix} ({itemsByPrefix[prefix]?.length || 0})
                </TabsTrigger>
              ))}
            </TabsList>

            {codePrefixes.map((prefix) => (
              <TabsContent key={prefix} value={prefix} className="mt-4">
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-right">GW (g)</TableHead>
                        <TableHead className="text-right">SW (g)</TableHead>
                        <TableHead className="text-right">NW (g)</TableHead>
                        <TableHead className="text-right">PCS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemsByPrefix[prefix]?.map((item) => {
                        const isSelected = selectedItems.has(item.code);
                        return (
                          <TableRow
                            key={item.code}
                            className={`cursor-pointer ${isSelected ? 'bg-primary/10' : 'hover:bg-accent'}`}
                            onClick={() => toggleItem(item.code)}
                          >
                            <TableCell>
                              {isSelected ? (
                                <CheckSquare className="h-5 w-5 text-primary" />
                              ) : (
                                <Square className="h-5 w-5 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell className="font-mono">{item.code}</TableCell>
                            <TableCell className="text-right">{item.grossWeight.toFixed(3)}</TableCell>
                            <TableCell className="text-right">{item.stoneWeight.toFixed(3)}</TableCell>
                            <TableCell className="text-right">{item.netWeight.toFixed(3)}</TableCell>
                            <TableCell className="text-right">{Number(item.pieces)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
