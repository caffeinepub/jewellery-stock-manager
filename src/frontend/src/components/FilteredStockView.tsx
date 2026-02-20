import { useState } from 'react';
import { JewelleryItem } from '../backend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface FilteredStockViewProps {
  items: JewelleryItem[];
  codePrefix: string;
  onBack: () => void;
  onAddToSelection: (selectedItems: JewelleryItem[]) => void;
}

export default function FilteredStockView({
  items,
  codePrefix,
  onBack,
  onAddToSelection,
}: FilteredStockViewProps) {
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  const handleRowClick = (code: string, event: React.MouseEvent) => {
    // Don't toggle if clicking on checkbox directly
    if ((event.target as HTMLElement).closest('button[role="checkbox"]')) {
      return;
    }

    const newSelected = new Set(selectedCodes);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      // Check if Ctrl/Cmd key is pressed for multi-select
      if (!event.ctrlKey && !event.metaKey) {
        newSelected.clear();
      }
      newSelected.add(code);
    }
    setSelectedCodes(newSelected);
  };

  const handleCheckboxChange = (code: string, checked: boolean) => {
    const newSelected = new Set(selectedCodes);
    if (checked) {
      newSelected.add(code);
    } else {
      newSelected.delete(code);
    }
    setSelectedCodes(newSelected);
  };

  const handleAddToSelection = () => {
    const selectedItems = items.filter((item) => selectedCodes.has(item.code));
    onAddToSelection(selectedItems);
    setSelectedCodes(new Set());
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-xl font-display">
              {codePrefix} Items ({items.length})
            </CardTitle>
          </div>
          {selectedCodes.size > 0 && (
            <Button onClick={handleAddToSelection} className="gap-2 shadow-soft">
              <Plus className="h-4 w-4" />
              Add {selectedCodes.size} to Selection
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border shadow-soft overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12"></TableHead>
                <TableHead className="font-semibold">CODE</TableHead>
                <TableHead className="text-right font-semibold">GW (g)</TableHead>
                <TableHead className="text-right font-semibold">SW (g)</TableHead>
                <TableHead className="text-right font-semibold">NW (g)</TableHead>
                <TableHead className="text-right font-semibold">PCS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No items found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const isSelected = selectedCodes.has(item.code);
                  return (
                    <TableRow
                      key={item.code}
                      onClick={(e) => handleRowClick(item.code, e)}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary/10 border-l-4 border-l-primary hover:bg-primary/15'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleCheckboxChange(item.code, checked as boolean)}
                          aria-label={`Select ${item.code}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono font-medium">{item.code}</TableCell>
                      <TableCell className="text-right">{item.grossWeight.toFixed(3)}</TableCell>
                      <TableCell className="text-right">{item.stoneWeight.toFixed(3)}</TableCell>
                      <TableCell className="text-right">{item.netWeight.toFixed(3)}</TableCell>
                      <TableCell className="text-right">{Number(item.pieces)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
