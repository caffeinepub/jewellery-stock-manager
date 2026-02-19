import { useStock } from '../hooks/useQueries';
import StockTable from '../components/StockTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Warehouse } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function StockView() {
  const { data: items, isLoading } = useStock();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Warehouse className="h-8 w-8 text-amber-600" />
          Stock
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {items ? `${items.length} items` : 'Loading...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <StockTable items={items || []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
