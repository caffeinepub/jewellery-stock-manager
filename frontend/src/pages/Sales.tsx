import { useState } from 'react';
import { FileSpreadsheet, PenLine, ScanLine, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ExcelUploader from '../components/ExcelUploader';
import ManualEntryForm from '../components/ManualEntryForm';
import BarcodeScanner from '../components/BarcodeScanner';
import TransactionPreview from '../components/TransactionPreview';
import CodeChartTabs from '../components/CodeChartTabs';
import TransactionTotalsView from '../components/TransactionTotalsView';
import { useAvailableStock, useTransactionsByType } from '../hooks/useQueries';
import { ItemType, JewelleryItem } from '../backend';
import type { ParsedItem } from '../utils/scannerParser';

export default function Sales() {
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [inputTab, setInputTab] = useState('excel');

  const { data: stockItems } = useAvailableStock(ItemType.purchase);
  const { data: salesTransactions } = useTransactionsByType(ItemType.sale);

  const availableStock = stockItems?.filter((i) => !i.isSold) ?? [];

  const handleStockSelected = (selectedItems: JewelleryItem[]) => {
    const mapped: ParsedItem[] = selectedItems.map((item) => ({
      code: item.code,
      grossWeight: item.grossWeight,
      stoneWeight: item.stoneWeight,
      netWeight: item.netWeight,
      pieces: Number(item.pieces),
      status: 'VALID' as const,
    }));
    setParsedItems(mapped);
  };

  const handleConfirm = () => {
    setParsedItems([]);
    setCustomerName('');
  };

  const handleCancel = () => {
    setParsedItems([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Sales</h1>
        <p className="text-sm text-muted-foreground mt-1">Record jewellery sales transactions</p>
      </div>

      {parsedItems.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <TransactionPreview
            items={parsedItems}
            transactionType="sale"
            customerName={customerName}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Customer Name */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold text-sm text-foreground">Customer</h2>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="customer"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Customer Name (optional)
              </Label>
              <Input
                id="customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name…"
                className="max-w-sm"
              />
            </div>
          </div>

          {/* Input Method */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <h2 className="font-display font-semibold text-sm text-foreground mb-4">Add Items</h2>
            <Tabs value={inputTab} onValueChange={setInputTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="excel" className="gap-2 text-xs">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2 text-xs">
                  <PenLine className="w-3.5 h-3.5" />
                  Manual
                </TabsTrigger>
                <TabsTrigger value="scan" className="gap-2 text-xs">
                  <ScanLine className="w-3.5 h-3.5" />
                  Scan
                </TabsTrigger>
                <TabsTrigger value="stock" className="gap-2 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  Stock
                </TabsTrigger>
              </TabsList>
              <TabsContent value="excel">
                <ExcelUploader onItemsParsed={setParsedItems} label="Upload Sales Excel" />
              </TabsContent>
              <TabsContent value="manual">
                <ManualEntryForm onItemAdded={(item) => setParsedItems([item])} />
              </TabsContent>
              <TabsContent value="scan">
                <BarcodeScanner onItemScanned={(item) => setParsedItems([item])} />
              </TabsContent>
              <TabsContent value="stock">
                <CodeChartTabs
                  items={availableStock}
                  onSelectionConfirmed={handleStockSelected}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Transaction History */}
          {salesTransactions && salesTransactions.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
              <TransactionTotalsView
                transactions={salesTransactions}
                title="Sales History"
                showReportDownloader
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
