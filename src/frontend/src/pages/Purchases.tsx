import { useState } from 'react';
import { ItemType } from '../backend';
import ExcelUploader from '../components/ExcelUploader';
import TransactionPreview from '../components/TransactionPreview';
import ManualEntryForm from '../components/ManualEntryForm';
import TransactionTotalsView from '../components/TransactionTotalsView';
import BarcodeScanner from '../components/BarcodeScanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Package, FileSpreadsheet, Edit, ScanLine } from 'lucide-react';
import type { ParsedItem } from '../utils/scannerParser';
import { parseScannerString } from '../utils/scannerParser';
import { toast } from 'sonner';

export default function Purchases() {
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [uploadMode, setUploadMode] = useState<'excel' | 'manual' | 'barcode' | null>(null);

  const handleManualEntry = (item: ParsedItem) => {
    setParsedItems((prev) => [...prev, item]);
  };

  const handleBarcodeScan = (data: string) => {
    try {
      const parsed = parseScannerString(data);
      if (parsed.status === 'VALID') {
        setParsedItems((prev) => [...prev, parsed]);
        toast.success('Barcode scanned successfully!');
        setUploadMode(null);
      } else if (parsed.status === 'MISTAKE') {
        toast.warning('Barcode scanned with warnings. Please verify the data.');
        setParsedItems((prev) => [...prev, parsed]);
        setUploadMode(null);
      } else {
        toast.error('Invalid barcode data. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to parse barcode data.');
    }
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="sticky top-16 z-40 bg-background pb-6 border-b">
        <h2 className="text-4xl font-bold tracking-tight flex items-center gap-3 font-display">
          <Package className="h-10 w-10 text-secondary" />
          Purchases
        </h2>
      </div>

      <Tabs defaultValue="make-entry" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-12 rounded-xl shadow-soft">
          <TabsTrigger value="make-entry" className="text-base rounded-lg">Make Entry</TabsTrigger>
          <TabsTrigger value="view-totals" className="text-base rounded-lg">View Totals</TabsTrigger>
        </TabsList>

        <TabsContent value="make-entry" className="space-y-8 mt-8">
          {/* Upload Options */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-xl font-display">Add Purchase Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!uploadMode && (
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    onClick={() => setUploadMode('excel')}
                    variant="outline"
                    className="h-24 flex-col gap-3 shadow-soft hover:shadow-medium transition-all duration-200"
                  >
                    <FileSpreadsheet className="h-8 w-8 text-success" />
                    <span className="text-sm font-medium">Excel Upload</span>
                  </Button>
                  <Button
                    onClick={() => setUploadMode('manual')}
                    variant="outline"
                    className="h-24 flex-col gap-3 shadow-soft hover:shadow-medium transition-all duration-200"
                  >
                    <Edit className="h-8 w-8 text-primary" />
                    <span className="text-sm font-medium">Manual Entry</span>
                  </Button>
                  <Button
                    onClick={() => setUploadMode('barcode')}
                    variant="outline"
                    className="h-24 flex-col gap-3 shadow-soft hover:shadow-medium transition-all duration-200"
                  >
                    <ScanLine className="h-8 w-8 text-secondary" />
                    <span className="text-sm font-medium">Scan Barcode</span>
                  </Button>
                </div>
              )}

              {uploadMode === 'excel' && (
                <div className="space-y-4">
                  <ExcelUploader onDataParsed={setParsedItems} />
                  <Button variant="outline" onClick={() => setUploadMode(null)}>
                    Cancel
                  </Button>
                </div>
              )}
              {uploadMode === 'manual' && (
                <div className="space-y-4">
                  <ManualEntryForm onEntryAdded={handleManualEntry} />
                  <Button variant="outline" onClick={() => setUploadMode(null)}>
                    Cancel
                  </Button>
                </div>
              )}
              {uploadMode === 'barcode' && (
                <BarcodeScanner
                  onScanSuccess={handleBarcodeScan}
                  onClose={() => setUploadMode(null)}
                />
              )}
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

        <TabsContent value="view-totals" className="mt-8">
          <TransactionTotalsView transactionType={ItemType.purchase} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
