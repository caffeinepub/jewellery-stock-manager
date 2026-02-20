import { useState } from 'react';
import { useStock } from '../hooks/useQueries';
import StockTable from '../components/StockTable';
import ReportDownloader from '../components/ReportDownloader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Warehouse } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function StockView() {
  const { data: items, isLoading } = useStock();
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  // Filter to show only live stock (not sold)
  const liveStock = items?.filter((item) => !item.isSold) || [];

  const handleSelectionChange = (codes: Set<string>) => {
    setSelectedCodes(codes);
  };

  const stockSummary = liveStock.reduce(
    (acc, item) => ({
      count: acc.count + 1,
      totalGW: acc.totalGW + item.grossWeight,
      totalPCS: acc.totalPCS + Number(item.pieces),
    }),
    { count: 0, totalGW: 0, totalPCS: 0 }
  );

  return (
    <div className="space-y-8 pb-8">
      <div className="sticky top-16 z-40 bg-background pb-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-4xl font-bold tracking-tight flex items-center gap-3 font-display">
            <Warehouse className="h-10 w-10 text-primary" />
            Stock
          </h2>
          <ReportDownloader 
            data={liveStock}
            filename="stock-report"
            title="Stock Report"
          />
        </div>
      </div>

      {/* Stock Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-soft hover:shadow-medium transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-muted-foreground">Live Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stockSummary.count}</div>
          </CardContent>
        </Card>
        <Card className="shadow-soft hover:shadow-medium transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-muted-foreground">Total Gross Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stockSummary.totalGW.toFixed(2)}g</div>
          </CardContent>
        </Card>
        <Card className="shadow-soft hover:shadow-medium transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-muted-foreground">Total Pieces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stockSummary.totalPCS}</div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="text-xl font-display">Live Stock Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ) : (
            <StockTable items={liveStock} onSelectionChange={handleSelectionChange} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
