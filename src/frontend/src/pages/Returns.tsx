import { useState } from 'react';
import { ItemType } from '../backend';
import ExcelUploader from '../components/ExcelUploader';
import TransactionPreview from '../components/TransactionPreview';
import ManualEntryForm from '../components/ManualEntryForm';
import CodeChartTabs from '../components/CodeChartTabs';
import TransactionTotalsView from '../components/TransactionTotalsView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw, PackageX, ShoppingBag } from 'lucide-react';
import type { ParsedItem } from '../utils/scannerParser';

export default function Returns() {
  const [purchaseReturnItems, setPurchaseReturnItems] = useState<ParsedItem[]>([]);
  const [salesReturnItems, setSalesReturnItems] = useState<ParsedItem[]>([]);

  const handlePurchaseReturnManualEntry = (item: ParsedItem) => {
    setPurchaseReturnItems((prev) => [...prev, item]);
  };

  const handleSalesReturnManualEntry = (item: ParsedItem) => {
    setSalesReturnItems((prev) => [...prev, item]);
  };

  const handleSalesReturnStockSelection = (items: ParsedItem[]) => {
    setSalesReturnItems(items);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <RotateCcw className="h-8 w-8 text-orange-600" />
          Returns
        </h2>
      </div>

      {/* Purchase Return Section */}
      <Card className="border-2 border-purple-200 dark:border-purple-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageX className="h-5 w-5 text-purple-600" />
            Purchase Return
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="make-entry" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="make-entry">Make Entry</TabsTrigger>
              <TabsTrigger value="view-totals">View Totals</TabsTrigger>
            </TabsList>

            <TabsContent value="make-entry" className="space-y-6 mt-6">
              {/* Excel Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Purchase Return Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExcelUploader onDataParsed={setPurchaseReturnItems} />
                </CardContent>
              </Card>

              {/* Manual Entry */}
              <Card>
                <CardHeader>
                  <CardTitle>Manual Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <ManualEntryForm onEntryAdded={handlePurchaseReturnManualEntry} />
                </CardContent>
              </Card>

              {/* Transaction Preview */}
              {purchaseReturnItems.length > 0 && (
                <TransactionPreview
                  items={purchaseReturnItems}
                  transactionType={ItemType.returned}
                  onComplete={() => setPurchaseReturnItems([])}
                  onItemsChange={setPurchaseReturnItems}
                  isPurchaseReturn={true}
                />
              )}
            </TabsContent>

            <TabsContent value="view-totals" className="mt-6">
              <TransactionTotalsView transactionType={ItemType.returned} isPurchaseReturn={true} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Sales Return Section */}
      <Card className="border-2 border-green-200 dark:border-green-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-green-600" />
            Sales Return
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="make-entry" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="make-entry">Make Entry</TabsTrigger>
              <TabsTrigger value="view-totals">View Totals</TabsTrigger>
            </TabsList>

            <TabsContent value="make-entry" className="space-y-6 mt-6">
              {/* CODE Chart Tabs for Stock Selection */}
              <CodeChartTabs
                transactionType={ItemType.returned}
                onSelectionComplete={handleSalesReturnStockSelection}
                isSalesReturn={true}
              />

              {/* Excel Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Sales Return Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExcelUploader onDataParsed={setSalesReturnItems} />
                </CardContent>
              </Card>

              {/* Manual Entry */}
              <Card>
                <CardHeader>
                  <CardTitle>Manual Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <ManualEntryForm onEntryAdded={handleSalesReturnManualEntry} />
                </CardContent>
              </Card>

              {/* Transaction Preview */}
              {salesReturnItems.length > 0 && (
                <TransactionPreview
                  items={salesReturnItems}
                  transactionType={ItemType.returned}
                  onComplete={() => setSalesReturnItems([])}
                  onItemsChange={setSalesReturnItems}
                  isSalesReturn={true}
                />
              )}
            </TabsContent>

            <TabsContent value="view-totals" className="mt-6">
              <TransactionTotalsView transactionType={ItemType.returned} isSalesReturn={true} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
