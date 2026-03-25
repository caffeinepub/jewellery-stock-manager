import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import type { JewelleryItem } from "../backend";
import StockTable from "./StockTable";

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
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
            data-ocid="stock.back.button"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h3 className="font-display font-semibold text-base text-foreground">
              Prefix: <span className="text-primary font-mono">{prefix}</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              {items.length} items · tap rows to select multiple
            </p>
          </div>
        </div>
      </div>

      <StockTable
        items={items}
        selectable
        selectedCodes={selectedCodes}
        onSelectionChange={setSelectedCodes}
      />

      {/* Sticky bottom CTA — always visible without scrolling */}
      {selectedCodes.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur border-t border-border shadow-lg">
          <Button
            onClick={() => onAddToSelection(selectedCodes)}
            className="w-full gap-2 h-12 text-base font-semibold"
            data-ocid="stock.add.primary_button"
          >
            <Plus className="w-4 h-4" />
            Add {selectedCodes.size} item{selectedCodes.size !== 1 ? "s" : ""}{" "}
            to Selection
          </Button>
        </div>
      )}
    </div>
  );
}
