import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StockTable from './StockTable';
import { JewelleryItem } from '../backend';

interface FilteredStockViewProps {
  items: JewelleryItem[];
  prefix: string;
  onBack: () => void;
  onAddToSelection: (codes: Set<string>) => void;
}

export default function FilteredStockView({
  items,
  prefix,
  onBack,
  onAddToSelection,
}: FilteredStockViewProps) {
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h3 className="font-display font-semibold text-base text-foreground">
              Prefix:{' '}
              <span className="text-primary font-mono">{prefix}</span>
            </h3>
            <p className="text-xs text-muted-foreground">{items.length} items</p>
          </div>
        </div>
        {selectedCodes.size > 0 && (
          <Button onClick={() => onAddToSelection(selectedCodes)} size="sm" className="gap-2">
            <Plus className="w-3.5 h-3.5" />
            Add {selectedCodes.size} to Selection
          </Button>
        )}
      </div>

      <StockTable
        items={items}
        selectable
        selectedCodes={selectedCodes}
        onSelectionChange={setSelectedCodes}
      />
    </div>
  );
}
