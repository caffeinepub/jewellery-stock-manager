import { useCustomers } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

export default function Customers() {
  const { data: customers, isLoading } = useCustomers();
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const selectedCustomerData = customers?.find((c) => c.name === selectedCustomer);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8 text-blue-600" />
          Customers
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>
              {customers ? `${customers.length} customers` : 'Loading...'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : customers && customers.length > 0 ? (
              <div className="space-y-2">
                {customers.map((customer) => (
                  <button
                    key={customer.name}
                    onClick={() => setSelectedCustomer(customer.name)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedCustomer === customer.name
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-accent border-border'
                    }`}
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {customer.transactionHistory.length} transactions
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No customers yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedCustomerData ? selectedCustomerData.name : 'Customer Details'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCustomerData ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>Select a customer to view details</p>
              </div>
            ) : (
              <Tabs defaultValue="ledger" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="ledger">Ledger</TabsTrigger>
                  <TabsTrigger value="holdings">Holdings</TabsTrigger>
                </TabsList>

                <TabsContent value="ledger" className="mt-6">
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
                        {selectedCustomerData.transactionHistory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              No transactions yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedCustomerData.transactionHistory.map((transaction) => (
                            <TableRow key={Number(transaction.id)}>
                              <TableCell>
                                {new Date(Number(transaction.timestamp) / 1000000).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {transaction.transactionType === 'sale' ? 'Sale' : 'Return'}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono">{transaction.item.code}</TableCell>
                              <TableCell className="text-right">
                                {transaction.item.grossWeight.toFixed(3)}
                              </TableCell>
                              <TableCell className="text-right">
                                {transaction.item.netWeight.toFixed(3)}
                              </TableCell>
                              <TableCell className="text-right">
                                {Number(transaction.item.pieces)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="holdings" className="mt-6">
                  <div className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {selectedCustomerData.currentHoldings.length}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Weight</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {selectedCustomerData.currentHoldings
                              .reduce((sum, item) => sum + item.netWeight, 0)
                              .toFixed(2)}
                            g
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Pieces</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {selectedCustomerData.currentHoldings.reduce(
                              (sum, item) => sum + Number(item.pieces),
                              0
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Holdings Table */}
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead className="text-right">GW (g)</TableHead>
                            <TableHead className="text-right">SW (g)</TableHead>
                            <TableHead className="text-right">NW (g)</TableHead>
                            <TableHead className="text-right">PCS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedCustomerData.currentHoldings.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No holdings
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedCustomerData.currentHoldings.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-mono">{item.code}</TableCell>
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
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
