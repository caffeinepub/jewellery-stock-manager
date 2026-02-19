import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CheckSquare, Square } from 'lucide-react';
import { JewelleryItem } from '../backend';
import type { ParsedItem } from '../utils/scannerParser';

interface FilteredStockViewProps {
  items: JewelleryItem[];
  codePrefix: string;
  onBack: () => void;
  onSelectionComplete: (items: ParsedItem[]) => void;
  existingSelections: Map<string, ParsedItem>;
}

export default function FilteredStockView({
  items,
  codePrefix,
  onBack,
  onSelectionComplete,
  existingSelections,
}: FilteredStockViewProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Initialize with existing selections for this CODE prefix
  useEffect(() => {
    const existingCodes = new Set<string>();
    items.forEach((item) => {
      if (existingSelections.has(item.code)) {
        existingCodes.add(item.code);
      }
    });
    setSelectedItems(existingCodes);
  }, [items, existingSelections]);

  const toggleItem = (code: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedItems(newSelected);
  };

  const handleDone = () => {
    const selectedStockItems = items.filter((item) => selectedItems.has(item.code));
    const parsedItems: ParsedItem[] = selectedStockItems.map((item) => ({
      code: item.code,
      grossWeight: item.grossWeight,
      stoneWeight: item.stoneWeight,
      netWeight: item.netWeight,
      pieces: Number(item.pieces),
      status: 'VALID' as const,
    }));

    onSelectionComplete(parsedItems);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle>{codePrefix} Items</CardTitle>
          </div>
          {selectedItems.size > 0 && (
            <Button onClick={handleDone}>
              Add to Selection ({selectedItems.size})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No items available</p>
        ) : (
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
                {items.map((item) => {
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
        )}
      </CardContent>
    </Card>
  );
}
