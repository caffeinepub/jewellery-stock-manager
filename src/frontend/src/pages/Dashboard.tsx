import { useStock, useTransactionsByType } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package, RotateCcw, Warehouse } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ItemType } from '../backend';
import { useMemo, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export default function Dashboard() {
  const { data: stockItems, isLoading: stockLoading } = useStock();
  const { data: salesTxs } = useTransactionsByType(ItemType.sale);
  const { data: purchaseTxs } = useTransactionsByType(ItemType.purchase);
  const { data: returnedTxs } = useTransactionsByType(ItemType.returned);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const navigate = useNavigate();

  // Calculate current stock metrics using live stock data (isSold=false)
  const currentStock = useMemo(() => {
    if (!stockItems) {
      return { count: 0, totalGW: 0, totalSW: 0, totalNW: 0, totalPCS: 0 };
    }

    // Filter to only unsold items (live stock)
    const liveStock = stockItems.filter(item => !item.isSold);

    return {
      count: liveStock.length,
      totalGW: liveStock.reduce((sum, item) => sum + item.grossWeight, 0),
      totalSW: liveStock.reduce((sum, item) => sum + item.stoneWeight, 0),
      totalNW: liveStock.reduce((sum, item) => sum + item.netWeight, 0),
      totalPCS: liveStock.reduce((sum, item) => sum + Number(item.pieces), 0),
    };
  }, [stockItems]);

  // Calculate transaction summary
  const transactionSummary = useMemo(() => {
    return {
      sales: {
        count: salesTxs?.length || 0,
        totalGW: salesTxs?.reduce((sum, tx) => sum + tx.item.grossWeight, 0) || 0,
        totalPCS: salesTxs?.reduce((sum, tx) => sum + Number(tx.item.pieces), 0) || 0,
      },
      purchases: {
        count: purchaseTxs?.length || 0,
        totalGW: purchaseTxs?.reduce((sum, tx) => sum + tx.item.grossWeight, 0) || 0,
        totalPCS: purchaseTxs?.reduce((sum, tx) => sum + Number(tx.item.pieces), 0) || 0,
      },
      returns: {
        count: returnedTxs?.length || 0,
        totalGW: returnedTxs?.reduce((sum, tx) => sum + tx.item.grossWeight, 0) || 0,
        totalPCS: returnedTxs?.reduce((sum, tx) => sum + Number(tx.item.pieces), 0) || 0,
      },
    };
  }, [salesTxs, purchaseTxs, returnedTxs]);

  const handleStockClick = () => {
    navigate({ to: '/stock' });
  };

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h2 className="text-4xl font-bold tracking-tight font-display">Dashboard</h2>
      </div>

      {/* Current Stock - Interactive Collapsible Tab */}
      <Collapsible open={isStockOpen} onOpenChange={setIsStockOpen}>
        <Card 
          className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 hover:shadow-strong transition-all duration-300 cursor-pointer"
          onClick={handleStockClick}
        >
          <CollapsibleTrigger className="w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="cursor-pointer pb-6">
              <CardTitle className="text-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-medium">
                    <Warehouse className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-display">
                      Current Stock
                    </div>
                    {!isStockOpen && !stockLoading && (
                      <div className="text-sm font-normal text-muted-foreground mt-1.5">
                        {currentStock.count} items • {currentStock.totalGW.toFixed(2)}g
                      </div>
                    )}
                  </div>
                </div>
                <ChevronDown className={`h-7 w-7 text-primary transition-transform duration-300 ${isStockOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-6">
              {stockLoading ? (
                <div className="grid gap-4 md:grid-cols-5">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="space-y-2 p-5 rounded-xl bg-background/60 border-2 border-primary/20 shadow-soft hover:shadow-medium transition-shadow duration-200">
                    <p className="text-sm font-medium text-muted-foreground">Items</p>
                    <p className="text-3xl font-bold text-primary">{currentStock.count}</p>
                  </div>
                  <div className="space-y-2 p-5 rounded-xl bg-background/60 border-2 border-primary/20 shadow-soft hover:shadow-medium transition-shadow duration-200">
                    <p className="text-sm font-medium text-muted-foreground">Gross Weight</p>
                    <p className="text-3xl font-bold text-primary">{currentStock.totalGW.toFixed(2)}g</p>
                  </div>
                  <div className="space-y-2 p-5 rounded-xl bg-background/60 border-2 border-primary/20 shadow-soft hover:shadow-medium transition-shadow duration-200">
                    <p className="text-sm font-medium text-muted-foreground">Stone Weight</p>
                    <p className="text-3xl font-bold text-primary">{currentStock.totalSW.toFixed(2)}g</p>
                  </div>
                  <div className="space-y-2 p-5 rounded-xl bg-background/60 border-2 border-primary/20 shadow-soft hover:shadow-medium transition-shadow duration-200">
                    <p className="text-sm font-medium text-muted-foreground">Net Weight</p>
                    <p className="text-3xl font-bold text-primary">{currentStock.totalNW.toFixed(2)}g</p>
                  </div>
                  <div className="space-y-2 p-5 rounded-xl bg-background/60 border-2 border-primary/20 shadow-soft hover:shadow-medium transition-shadow duration-200">
                    <p className="text-sm font-medium text-muted-foreground">Pieces</p>
                    <p className="text-3xl font-bold text-primary">{currentStock.totalPCS}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Transaction Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card
          className="cursor-pointer hover:shadow-strong transition-all duration-300 border-2 border-success/30 bg-gradient-to-br from-success/10 to-success/5 hover:scale-[1.02]"
          onClick={() => navigate({ to: '/sales' })}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-success to-success/80 shadow-medium">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-success font-display">Sales</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total GW:</span>
              <span className="text-2xl font-bold text-success">
                {transactionSummary.sales.totalGW.toFixed(2)}g
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Pieces:</span>
              <span className="text-2xl font-bold text-success">
                {transactionSummary.sales.totalPCS}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-strong transition-all duration-300 border-2 border-secondary/30 bg-gradient-to-br from-secondary/10 to-secondary/5 hover:scale-[1.02]"
          onClick={() => navigate({ to: '/purchases' })}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 shadow-medium">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-secondary font-display">Purchases</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total GW:</span>
              <span className="text-2xl font-bold text-secondary">
                {transactionSummary.purchases.totalGW.toFixed(2)}g
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Pieces:</span>
              <span className="text-2xl font-bold text-secondary">
                {transactionSummary.purchases.totalPCS}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-strong transition-all duration-300 border-2 border-warning/30 bg-gradient-to-br from-warning/10 to-warning/5 hover:scale-[1.02]"
          onClick={() => navigate({ to: '/returns' })}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-warning to-warning/80 shadow-medium">
                <RotateCcw className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-warning font-display">Returns</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total GW:</span>
              <span className="text-2xl font-bold text-warning">
                {transactionSummary.returns.totalGW.toFixed(2)}g
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Pieces:</span>
              <span className="text-2xl font-bold text-warning">
                {transactionSummary.returns.totalPCS}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
