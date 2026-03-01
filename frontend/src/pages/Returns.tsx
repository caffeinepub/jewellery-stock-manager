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

export default function Returns() {
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [returnType, setReturnType] = useState<'salesReturn' | 'purchaseReturn'>('salesReturn');
  const [inputTab, setInputTab] = useState('excel');

  const { data: salesReturnTransactions } = useTransactionsByType(ItemType.salesReturn);
  const { data: purchaseReturnTransactions } = useTransactionsByType(ItemType.purchaseReturn);

  const returnTransactions =
    returnType === 'salesReturn'
      ? (salesReturnTransactions ?? [])
      : (purchaseReturnTransactions ?? []);

  const handleConfirm = () => {
    setParsedItems([]);
  };

  const handleCancel = () => {
    setParsedItems([]);
  };

  const handleItemAdded = (item: ParsedItem) => {
    setParsedItems((prev) => [...prev, item]);
  };

  const handleItemScanned = (item: ParsedItem) => {
    setParsedItems((prev) => [...prev, item]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Returns</h1>
        <p className="text-sm text-muted-foreground mt-1">Process sales and purchase returns</p>
      </div>

      {/* Return Type Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setReturnType('salesReturn');
            setParsedItems([]);
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            returnType === 'salesReturn'
              ? 'bg-primary text-primary-foreground border-primary shadow-soft'
              : 'bg-card text-muted-foreground border-border hover:border-primary/40'
          }`}
        >
          Sales Return
        </button>
        <button
          onClick={() => {
            setReturnType('purchaseReturn');
            setParsedItems([]);
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            returnType === 'purchaseReturn'
              ? 'bg-primary text-primary-foreground border-primary shadow-soft'
              : 'bg-card text-muted-foreground border-border hover:border-primary/40'
          }`}
        >
          Purchase Return
        </button>
      </div>

      {parsedItems.length > 0 ? (
        <TransactionPreview
          items={parsedItems}
          transactionType={returnType}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      ) : (
        <Tabs value={inputTab} onValueChange={setInputTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-sm">
            <TabsTrigger value="excel" className="gap-1.5 text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5 text-xs">
              <PenLine className="w-3.5 h-3.5" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="scanner" className="gap-1.5 text-xs">
              <ScanLine className="w-3.5 h-3.5" />
              Scanner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="excel" className="mt-4">
            <ExcelUploader onItemsParsed={setParsedItems} />
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <ManualEntryForm onItemAdded={handleItemAdded} />
          </TabsContent>

          <TabsContent value="scanner" className="mt-4">
            <BarcodeScanner onItemScanned={handleItemScanned} />
          </TabsContent>
        </Tabs>
      )}

      {/* Transaction History */}
      <div className="mt-8">
        <h2 className="font-display font-semibold text-base text-foreground mb-3">
          {returnType === 'salesReturn' ? 'Sales Returns' : 'Purchase Returns'} History
        </h2>
        <TransactionTotalsView transactions={returnTransactions} />
      </div>
    </div>
  );
}
