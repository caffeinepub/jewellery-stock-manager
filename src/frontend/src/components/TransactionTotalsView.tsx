import { useTransactionsByType } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ItemType } from '../backend';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

interface TransactionTotalsViewProps {
  transactionType: ItemType;
  isPurchaseReturn?: boolean;
  isSalesReturn?: boolean;
}

export default function TransactionTotalsView({
  transactionType,
  isPurchaseReturn,
  isSalesReturn,
}: TransactionTotalsViewProps) {
  const { data: transactions, isLoading } = useTransactionsByType(transactionType);

  const { todayTransactions, allTransactions, byCategory } = useMemo(() => {
    if (!transactions) return { todayTransactions: [], allTransactions: [], byCategory: {} };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = BigInt(today.getTime() * 1000000);

    const todayTxs = transactions.filter((t) => t.timestamp >= todayTimestamp);

    // Group by CODE prefix
    const categories: Record<string, typeof transactions> = {};
    transactions.forEach((t) => {
      const match = t.item.code.match(/^([A-Z]+)/);
      const prefix = match ? match[1] : 'OTHER';
      if (!categories[prefix]) {
        categories[prefix] = [];
      }
      categories[prefix].push(t);
    });

    return {
      todayTransactions: todayTxs,
      allTransactions: transactions,
      byCategory: categories,
    };
  }, [transactions]);

  const calculateTotals = (txs: typeof transactions) => {
    if (!txs) return { count: 0, totalGW: 0, totalNW: 0, totalPCS: 0 };
    return {
      count: txs.length,
      totalGW: txs.reduce((sum, t) => sum + t.item.grossWeight, 0),
      totalNW: txs.reduce((sum, t) => sum + t.item.netWeight, 0),
      totalPCS: txs.reduce((sum, t) => sum + Number(t.item.pieces), 0),
    };
  };

  const todayTotals = calculateTotals(todayTransactions);
  const overallTotals = calculateTotals(allTransactions);

  const getTitle = () => {
    if (isPurchaseReturn) return 'Purchase Return Totals';
    if (isSalesReturn) return 'Sales Return Totals';
    switch (transactionType) {
      case ItemType.sale:
        return 'Sales Totals';
      case ItemType.purchase:
        return 'Purchase Totals';
      case ItemType.returned:
        return 'Return Totals';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Transactions</CardTitle>
            <CardDescription>Transactions recorded today</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Count:</span>
                  <span className="font-semibold">{todayTotals.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total GW:</span>
                  <span className="font-semibold">{todayTotals.totalGW.toFixed(3)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total NW:</span>
                  <span className="font-semibold">{todayTotals.totalNW.toFixed(3)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total PCS:</span>
                  <span className="font-semibold">{todayTotals.totalPCS}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Period</CardTitle>
            <CardDescription>All time transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Count:</span>
                  <span className="font-semibold">{overallTotals.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total GW:</span>
                  <span className="font-semibold">{overallTotals.totalGW.toFixed(3)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total NW:</span>
                  <span className="font-semibold">{overallTotals.totalNW.toFixed(3)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total PCS:</span>
                  <span className="font-semibold">{overallTotals.totalPCS}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* By Category */}
      <Card>
        <CardHeader>
          <CardTitle>By Design Category</CardTitle>
          <CardDescription>Transactions grouped by CODE prefix</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : Object.keys(byCategory).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Total GW (g)</TableHead>
                    <TableHead className="text-right">Total NW (g)</TableHead>
                    <TableHead className="text-right">Total PCS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(byCategory)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([category, txs]) => {
                      const totals = calculateTotals(txs);
                      return (
                        <TableRow key={category}>
                          <TableCell className="font-medium">{category}</TableCell>
                          <TableCell className="text-right">{totals.count}</TableCell>
                          <TableCell className="text-right">{totals.totalGW.toFixed(3)}</TableCell>
                          <TableCell className="text-right">{totals.totalNW.toFixed(3)}</TableCell>
                          <TableCell className="text-right">{totals.totalPCS}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
