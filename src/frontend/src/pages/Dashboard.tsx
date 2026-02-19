import { useStock, useTransactionsByType } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Package, ShoppingCart, RotateCcw, Gem, Warehouse } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ItemType } from '../backend';
import { useMemo } from 'react';

export default function Dashboard() {
  const { data: stockItems, isLoading: stockLoading } = useStock();
  const { data: salesTxs } = useTransactionsByType(ItemType.sale);
  const { data: purchaseTxs } = useTransactionsByType(ItemType.purchase);
  const { data: returnedTxs } = useTransactionsByType(ItemType.returned);

  // Calculate current stock metrics
  const currentStock = useMemo(() => {
    if (!stockItems) return { count: 0, totalGW: 0, totalSW: 0, totalNW: 0, totalPCS: 0 };
    
    const availableItems = stockItems.filter(item => !item.isSold);
    
    return {
      count: availableItems.length,
      totalGW: availableItems.reduce((sum, item) => sum + item.grossWeight, 0),
      totalSW: availableItems.reduce((sum, item) => sum + item.stoneWeight, 0),
      totalNW: availableItems.reduce((sum, item) => sum + item.netWeight, 0),
      totalPCS: availableItems.reduce((sum, item) => sum + Number(item.pieces), 0),
    };
  }, [stockItems]);

  // Calculate transaction counts
  const transactionCounts = useMemo(() => {
    return {
      sales: salesTxs?.length || 0,
      purchases: purchaseTxs?.length || 0,
      returns: returnedTxs?.length || 0,
      total: (salesTxs?.length || 0) + (purchaseTxs?.length || 0) + (returnedTxs?.length || 0),
    };
  }, [salesTxs, purchaseTxs, returnedTxs]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {/* Current Stock Overview */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-primary" />
            Current Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stockLoading ? (
            <div className="grid gap-4 md:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Items</p>
                <p className="text-3xl font-bold">{currentStock.count}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Gross Weight</p>
                <p className="text-3xl font-bold">{currentStock.totalGW.toFixed(2)}g</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Stone Weight</p>
                <p className="text-3xl font-bold">{currentStock.totalSW.toFixed(2)}g</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Net Weight</p>
                <p className="text-3xl font-bold">{currentStock.totalNW.toFixed(2)}g</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pieces</p>
                <p className="text-3xl font-bold">{currentStock.totalPCS}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <div className="rounded-lg p-2 bg-blue-50 dark:bg-blue-950/20">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactionCounts.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <div className="rounded-lg p-2 bg-green-50 dark:bg-green-950/20">
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactionCounts.sales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchases</CardTitle>
            <div className="rounded-lg p-2 bg-purple-50 dark:bg-purple-950/20">
              <Package className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactionCounts.purchases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returns</CardTitle>
            <div className="rounded-lg p-2 bg-orange-50 dark:bg-orange-950/20">
              <RotateCcw className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactionCounts.returns}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/sales"
              className="flex flex-col items-center justify-center rounded-lg border border-border p-6 text-center transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ShoppingCart className="h-8 w-8 mb-2 text-green-600" />
              <h3 className="font-semibold">Sales</h3>
            </a>
            <a
              href="/purchases"
              className="flex flex-col items-center justify-center rounded-lg border border-border p-6 text-center transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Package className="h-8 w-8 mb-2 text-purple-600" />
              <h3 className="font-semibold">Purchases</h3>
            </a>
            <a
              href="/stock"
              className="flex flex-col items-center justify-center rounded-lg border border-border p-6 text-center transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Gem className="h-8 w-8 mb-2 text-amber-600" />
              <h3 className="font-semibold">Stock</h3>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
