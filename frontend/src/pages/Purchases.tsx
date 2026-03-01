import { useState } from 'react';
import { FileSpreadsheet, PenLine, ScanLine } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ExcelUploader from '../components/ExcelUploader';
import ManualEntryForm from '../components/ManualEntryForm';
import BarcodeScanner from '../components/BarcodeScanner';
import TransactionPreview from '../components/TransactionPreview';
import TransactionTotalsView from '../components/TransactionTotalsView';
import { useTransactionsByType } from '../hooks/useQueries';
import { ItemType } from '../backend';
import type { ParsedItem } from '../utils/scannerParser';

export default function Purchases() {
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [inputTab, setInputTab] = useState('excel');

  const { data: purchaseTransactions } = useTransactionsByType(ItemType.purchase);

  const handleConfirm = () => {
    setParsedItems([]);
  };

  const handleCancel = () => {
    setParsedItems([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Purchases</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Record jewellery purchase transactions
        </p>
      </div>

      {parsedItems.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <TransactionPreview
            items={parsedItems}
            transactionType="purchase"
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="space-y-6">
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
              </TabsList>
              <TabsContent value="excel">
                <ExcelUploader onItemsParsed={setParsedItems} label="Upload Purchases Excel" />
              </TabsContent>
              <TabsContent value="manual">
                <ManualEntryForm onItemAdded={(item) => setParsedItems([item])} />
              </TabsContent>
              <TabsContent value="scan">
                <BarcodeScanner onItemScanned={(item) => setParsedItems([item])} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Transaction History */}
          {purchaseTransactions && purchaseTransactions.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
              <TransactionTotalsView
                transactions={purchaseTransactions}
                title="Purchase History"
                showReportDownloader
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
