import { useFactoryLedger } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Factory as FactoryIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function Factory() {
  const { data: transactions, isLoading } = useFactoryLedger();

  const totals = transactions
    ? {
        count: transactions.length,
        totalGW: transactions.reduce((sum, t) => sum + t.item.grossWeight, 0),
        totalNW: transactions.reduce((sum, t) => sum + t.item.netWeight, 0),
        totalPCS: transactions.reduce((sum, t) => sum + Number(t.item.pieces), 0),
      }
    : { count: 0, totalGW: 0, totalNW: 0, totalPCS: 0 };

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-40 bg-background pb-4 border-b">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FactoryIcon className="h-8 w-8 text-indigo-600" />
          Factory
        </h2>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total GW</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalGW.toFixed(2)}g</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total NW</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalNW.toFixed(2)}g</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total PCS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalPCS}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger */}
      <Card>
        <CardHeader>
          <CardTitle>Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">GW (g)</TableHead>
                    <TableHead className="text-right">NW (g)</TableHead>
                    <TableHead className="text-right">PCS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!transactions || transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No transactions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={Number(transaction.id)}>
                        <TableCell>
                          {format(new Date(Number(transaction.timestamp) / 1000000), 'PPp')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.transactionType === 'purchase' ? 'default' : 'outline'}>
                            {transaction.transactionType === 'purchase' ? 'Purchase' : 'Return'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{transaction.item.code}</TableCell>
                        <TableCell className="text-right">{transaction.item.grossWeight.toFixed(3)}</TableCell>
                        <TableCell className="text-right">{transaction.item.netWeight.toFixed(3)}</TableCell>
                        <TableCell className="text-right">{Number(transaction.item.pieces)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
