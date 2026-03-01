import { useState, useMemo } from 'react';
import { useActor } from '../hooks/useActor';
import { useQuery } from '@tanstack/react-query';
import { Customer, ItemType } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Users, CalendarIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function Customers() {
  const { actor, isFetching } = useActor();
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getAllCustomers();
    },
    enabled: !!actor && !isFetching,
  });

  const selectedCustomerData = customers?.find((c) => c.name === selectedCustomer);

  // Filter transactions by date range and separate sales from returns
  const { salesTransactions, returnTransactions } = useMemo(() => {
    if (!selectedCustomerData) return { salesTransactions: [], returnTransactions: [] };

    let filtered = selectedCustomerData.transactionHistory;

    if (dateRange.from) {
      const fromTimestamp = BigInt(dateRange.from.getTime() * 1000000);
      filtered = filtered.filter((tx) => tx.timestamp >= fromTimestamp);
    }

    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      const toTimestamp = BigInt(toDate.getTime() * 1000000);
      filtered = filtered.filter((tx) => tx.timestamp <= toTimestamp);
    }

    const sales = filtered.filter((tx) => tx.transactionType === ItemType.sale);
    // Customer returns are sales returns (items returned by customer back to shop)
    const returns = filtered.filter(
      (tx) =>
        tx.transactionType === ItemType.salesReturn ||
        tx.transactionType === ItemType.purchaseReturn
    );

    return { salesTransactions: sales, returnTransactions: returns };
  }, [selectedCustomerData, dateRange]);

  // Calculate totals for sales only
  const customerTotals = useMemo(() => {
    return {
      salesCount: salesTransactions.length,
      returnsCount: returnTransactions.length,
      totalGW: salesTransactions.reduce((sum, tx) => sum + tx.item.grossWeight, 0),
      totalPCS: salesTransactions.reduce((sum, tx) => sum + Number(tx.item.pieces), 0),
    };
  }, [salesTransactions, returnTransactions]);

  return (
    <div className="space-y-8 pb-8">
      <div className="sticky top-16 z-40 bg-background pb-6 border-b">
        <h2 className="text-4xl font-bold tracking-tight flex items-center gap-3 font-display">
          <Users className="h-10 w-10 text-secondary" />
          Customers
        </h2>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : !customers || customers.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="py-16">
            <p className="text-center text-muted-foreground text-lg">
              No customers yet. Customers will appear here when you add their names during sales transactions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Customer Tabs */}
          <Tabs value={selectedCustomer || customers[0]?.name} onValueChange={setSelectedCustomer}>
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex h-12 items-center justify-start rounded-xl bg-muted p-1 shadow-soft">
                {customers.map((customer) => (
                  <TabsTrigger
                    key={customer.name}
                    value={customer.name}
                    className="whitespace-nowrap px-6 rounded-lg text-base"
                  >
                    {customer.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {customers.map((customer) => (
              <TabsContent key={customer.name} value={customer.name} className="space-y-8 mt-8">
                {/* Dashboard Summary */}
                <div className="grid gap-6 md:grid-cols-4">
                  <Card className="shadow-soft hover:shadow-medium transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium text-muted-foreground">Total Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-success">{customerTotals.salesCount}</div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-soft hover:shadow-medium transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium text-muted-foreground">Total Returns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-warning">{customerTotals.returnsCount}</div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-soft hover:shadow-medium transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium text-muted-foreground">Total GW (Sales)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">{customerTotals.totalGW.toFixed(2)}g</div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-soft hover:shadow-medium transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium text-muted-foreground">Total PCS (Sales)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">{customerTotals.totalPCS}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Date Filter */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <CardTitle className="text-xl font-display">Filter by Date</CardTitle>
                      <div className="flex flex-wrap gap-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 shadow-soft">
                              <CalendarIcon className="h-4 w-4" />
                              {dateRange.from ? format(dateRange.from, 'PP') : 'From'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={dateRange.from}
                              onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 shadow-soft">
                              <CalendarIcon className="h-4 w-4" />
                              {dateRange.to ? format(dateRange.to, 'PP') : 'To'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={dateRange.to}
                              onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {(dateRange.from || dateRange.to) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDateRange({ from: undefined, to: undefined })}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Sales History */}
                <Card className="shadow-medium border-l-4 border-l-success">
                  <CardHeader>
                    <CardTitle className="text-xl font-display">Sales History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Code</TableHead>
                            <TableHead className="text-right font-semibold">GW (g)</TableHead>
                            <TableHead className="text-right font-semibold">SW (g)</TableHead>
                            <TableHead className="text-right font-semibold">NW (g)</TableHead>
                            <TableHead className="text-right font-semibold">PCS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salesTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                                No sales found
                              </TableCell>
                            </TableRow>
                          ) : (
                            salesTransactions.map((tx) => (
                              <TableRow key={Number(tx.id)} className="hover:bg-muted/30 transition-colors duration-200">
                                <TableCell>
                                  {format(new Date(Number(tx.timestamp) / 1000000), 'PPp')}
                                </TableCell>
                                <TableCell className="font-mono font-medium">{tx.item.code}</TableCell>
                                <TableCell className="text-right">{tx.item.grossWeight.toFixed(3)}</TableCell>
                                <TableCell className="text-right">{tx.item.stoneWeight.toFixed(3)}</TableCell>
                                <TableCell className="text-right">{tx.item.netWeight.toFixed(3)}</TableCell>
                                <TableCell className="text-right">{Number(tx.item.pieces)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Returns History */}
                <Card className="shadow-medium border-l-4 border-l-warning">
                  <CardHeader>
                    <CardTitle className="text-xl font-display">Returns History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Code</TableHead>
                            <TableHead className="text-right font-semibold">GW (g)</TableHead>
                            <TableHead className="text-right font-semibold">SW (g)</TableHead>
                            <TableHead className="text-right font-semibold">NW (g)</TableHead>
                            <TableHead className="text-right font-semibold">PCS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {returnTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                                No returns found
                              </TableCell>
                            </TableRow>
                          ) : (
                            returnTransactions.map((tx) => (
                              <TableRow key={Number(tx.id)} className="hover:bg-muted/30 transition-colors duration-200">
                                <TableCell>
                                  {format(new Date(Number(tx.timestamp) / 1000000), 'PPp')}
                                </TableCell>
                                <TableCell className="font-mono font-medium">{tx.item.code}</TableCell>
                                <TableCell className="text-right">{tx.item.grossWeight.toFixed(3)}</TableCell>
                                <TableCell className="text-right">{tx.item.stoneWeight.toFixed(3)}</TableCell>
                                <TableCell className="text-right">{tx.item.netWeight.toFixed(3)}</TableCell>
                                <TableCell className="text-right">{Number(tx.item.pieces)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Holdings */}
                <Card className="shadow-medium">
                  <CardHeader>
                    <CardTitle className="text-xl font-display">Items Sold to Customer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Code</TableHead>
                            <TableHead className="text-right font-semibold">GW (g)</TableHead>
                            <TableHead className="text-right font-semibold">SW (g)</TableHead>
                            <TableHead className="text-right font-semibold">NW (g)</TableHead>
                            <TableHead className="text-right font-semibold">PCS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customer.currentHoldings.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                No items
                              </TableCell>
                            </TableRow>
                          ) : (
                            customer.currentHoldings.map((item, idx) => (
                              <TableRow key={idx} className="hover:bg-muted/30 transition-colors duration-200">
                                <TableCell className="font-mono font-medium">{item.code}</TableCell>
                                <TableCell className="text-right">{item.grossWeight.toFixed(3)}</TableCell>
                                <TableCell className="text-right">{item.stoneWeight.toFixed(3)}</TableCell>
                                <TableCell className="text-right">{item.netWeight.toFixed(3)}</TableCell>
                                <TableCell className="text-right">{Number(item.pieces)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
}
