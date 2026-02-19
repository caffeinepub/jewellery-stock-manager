import { useState } from 'react';
import { ItemType } from '../backend';
import ExcelUploader from '../components/ExcelUploader';
import TransactionPreview from '../components/TransactionPreview';
import ManualEntryForm from '../components/ManualEntryForm';
import TransactionTotalsView from '../components/TransactionTotalsView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package } from 'lucide-react';
import type { ParsedItem } from '../utils/scannerParser';

export default function Purchases() {
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);

  const handleManualEntry = (item: ParsedItem) => {
    setParsedItems((prev) => [...prev, item]);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Package className="h-8 w-8 text-purple-600" />
          Purchases
        </h2>
      </div>

      <Tabs defaultValue="make-entry" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="make-entry">Make Entry</TabsTrigger>
          <TabsTrigger value="view-totals">View Totals</TabsTrigger>
        </TabsList>

        <TabsContent value="make-entry" className="space-y-6 mt-6">
          {/* Excel Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Purchase Data</CardTitle>
            </CardHeader>
            <CardContent>
              <ExcelUploader onDataParsed={setParsedItems} />
            </CardContent>
          </Card>

          {/* Manual Entry */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <ManualEntryForm onEntryAdded={handleManualEntry} />
            </CardContent>
          </Card>

          {/* Transaction Preview */}
          {parsedItems.length > 0 && (
            <TransactionPreview
              items={parsedItems}
              transactionType={ItemType.purchase}
              onComplete={() => setParsedItems([])}
              onItemsChange={setParsedItems}
            />
          )}
        </TabsContent>

        <TabsContent value="view-totals" className="mt-6">
          <TransactionTotalsView transactionType={ItemType.purchase} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
