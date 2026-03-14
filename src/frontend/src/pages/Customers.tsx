import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { CalendarIcon, Edit2, Loader2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { Customer, ItemType } from "../backend";
import { useCustomers, useRenameCustomer } from "../hooks/useQueries";

function matchesType(txType: ItemType, expectedKey: string): boolean {
  if (typeof txType === "string") return (txType as string) === expectedKey;
  return Object.keys(txType as unknown as object)[0] === expectedKey;
}

interface LedgerRow {
  date: string;
  type: "sale" | "salesReturn";
  code: string;
  gw: number;
  nw: number;
  metalPurity: number | undefined;
  metalBalance: number | undefined;
  cashBalance: number | undefined;
}

export default function Customers() {
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState("");
  const [renameValue, setRenameValue] = useState("");

  const { data: customers, isLoading } = useCustomers();
  const renameCustomer = useRenameCustomer();

  const activeCustomerName = selectedCustomer || customers?.[0]?.name || null;
  const selectedCustomerData = customers?.find(
    (c) => c.name === activeCustomerName,
  );

  const { salesTransactions, returnTransactions } = useMemo(() => {
    if (!selectedCustomerData)
      return { salesTransactions: [], returnTransactions: [] };

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

    const sales = filtered.filter((tx) =>
      matchesType(tx.transactionType, "sale"),
    );
    const returns = filtered.filter((tx) =>
      matchesType(tx.transactionType, "salesReturn"),
    );

    return { salesTransactions: sales, returnTransactions: returns };
  }, [selectedCustomerData, dateRange]);

  const customerTotals = useMemo(() => {
    return {
      salesCount: salesTransactions.length,
      returnsCount: returnTransactions.length,
      totalGW: salesTransactions.reduce(
        (sum, tx) => sum + tx.item.grossWeight,
        0,
      ),
      totalPCS: salesTransactions.reduce(
        (sum, tx) => sum + Number(tx.item.pieces),
        0,
      ),
    };
  }, [salesTransactions, returnTransactions]);

  // Build credit/debit ledger with new columns
  const ledgerRows = useMemo((): LedgerRow[] => {
    const allTx = [...salesTransactions, ...returnTransactions].sort((a, b) =>
      Number(a.timestamp - b.timestamp),
    );
    return allTx.map((tx) => {
      const isSale = matchesType(tx.transactionType, "sale");
      const gw = tx.item.grossWeight;
      const nw = tx.item.netWeight;
      return {
        date: format(new Date(Number(tx.timestamp) / 1000000), "dd MMM yyyy"),
        type: isSale ? "sale" : "salesReturn",
        code: tx.item.code,
        gw,
        nw,
        metalPurity: tx.metalPurity,
        metalBalance: tx.metalBalance,
        cashBalance: tx.cashBalance,
      };
    });
  }, [salesTransactions, returnTransactions]);

  const handleRenameOpen = (customerName: string) => {
    setRenameTarget(customerName);
    setRenameValue(customerName);
    setRenameDialogOpen(true);
  };

  const handleRenameSave = async () => {
    if (!renameTarget) return;
    await renameCustomer.mutateAsync({
      oldName: renameTarget,
      newName: renameValue.trim(),
    });
    setRenameDialogOpen(false);
    if (selectedCustomer === renameTarget) {
      setSelectedCustomer(renameValue.trim() || null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Colorful Page Header */}
      <div className="page-header-customers rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Customers
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sales history, returns and party ledger per customer
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : !customers || customers.length === 0 ? (
        <Card className="shadow-soft" data-ocid="customers.empty_state">
          <CardContent className="py-16">
            <p className="text-center text-muted-foreground text-lg">
              No customers yet. Customers will appear here when you add their
              names during sales transactions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs
            value={activeCustomerName ?? customers[0]?.name}
            onValueChange={setSelectedCustomer}
          >
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex h-10 items-center justify-start rounded-xl bg-primary/10 p-1 shadow-soft">
                {customers.map((customer) => (
                  <TabsTrigger
                    key={customer.name}
                    value={customer.name}
                    className="whitespace-nowrap px-4 rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
                    data-ocid="customers.tab"
                  >
                    {customer.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {customers.map((customer) => (
              <TabsContent
                key={customer.name}
                value={customer.name}
                className="space-y-6 mt-6"
              >
                {/* Customer Header with Rename */}
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-foreground">
                    {customer.name}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => handleRenameOpen(customer.name)}
                    data-ocid="customers.edit_button"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Rename
                  </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 rounded-2xl p-5 shadow-soft">
                    <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">
                      Total Sales
                    </p>
                    <p className="text-2xl font-display font-bold text-emerald-900">
                      {customerTotals.salesCount}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 rounded-2xl p-5 shadow-soft">
                    <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">
                      Total Returns
                    </p>
                    <p className="text-2xl font-display font-bold text-amber-900">
                      {customerTotals.returnsCount}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-200 rounded-2xl p-5 shadow-soft">
                    <p className="text-xs font-medium text-violet-700 uppercase tracking-wide mb-1">
                      Total GW (Sales)
                    </p>
                    <p className="text-2xl font-display font-bold text-violet-900">
                      {customerTotals.totalGW.toFixed(2)}g
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl p-5 shadow-soft">
                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
                      Total PCS (Sales)
                    </p>
                    <p className="text-2xl font-display font-bold text-blue-900">
                      {customerTotals.totalPCS}
                    </p>
                  </div>
                </div>

                {/* Date Filter */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-soft section-card-violet">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h2 className="font-display font-semibold text-sm text-foreground">
                      Filter by Date
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-xs"
                          >
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {dateRange.from
                              ? format(dateRange.from, "PP")
                              : "From"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) =>
                              setDateRange({ ...dateRange, from: date })
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-xs"
                          >
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {dateRange.to ? format(dateRange.to, "PP") : "To"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) =>
                              setDateRange({ ...dateRange, to: date })
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {(dateRange.from || dateRange.to) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() =>
                            setDateRange({ from: undefined, to: undefined })
                          }
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sales History */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-soft section-card-green">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-5 rounded-full bg-success" />
                    <h2 className="font-display font-semibold text-sm text-foreground">
                      Sales History
                    </h2>
                  </div>
                  <div className="rounded-xl border overflow-hidden overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="thead-green">
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">Code</TableHead>
                          <TableHead className="text-right font-semibold">
                            GW (g)
                          </TableHead>
                          <TableHead className="text-right font-semibold">
                            SW (g)
                          </TableHead>
                          <TableHead className="text-right font-semibold">
                            NW (g)
                          </TableHead>
                          <TableHead className="text-right font-semibold">
                            PCS
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center text-muted-foreground py-12"
                              data-ocid="customers.sales.empty_state"
                            >
                              No sales found
                            </TableCell>
                          </TableRow>
                        ) : (
                          salesTransactions.map((tx, idx) => (
                            <TableRow
                              key={Number(tx.id)}
                              className={`hover:bg-success/5 transition-colors ${
                                idx % 2 === 0 ? "bg-emerald-50/30" : ""
                              }`}
                              data-ocid={`customers.sales.item.${idx + 1}`}
                            >
                              <TableCell className="text-xs">
                                {format(
                                  new Date(Number(tx.timestamp) / 1000000),
                                  "PPp",
                                )}
                              </TableCell>
                              <TableCell className="font-mono font-medium">
                                {tx.item.code}
                              </TableCell>
                              <TableCell className="text-right text-emerald-800 font-medium">
                                {tx.item.grossWeight.toFixed(3)}
                              </TableCell>
                              <TableCell className="text-right text-emerald-700">
                                {tx.item.stoneWeight.toFixed(3)}
                              </TableCell>
                              <TableCell className="text-right text-emerald-700">
                                {tx.item.netWeight.toFixed(3)}
                              </TableCell>
                              <TableCell className="text-right text-emerald-800">
                                {Number(tx.item.pieces)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Returns History */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-soft section-card-rose">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-5 rounded-full bg-destructive" />
                    <h2 className="font-display font-semibold text-sm text-foreground">
                      Sales Returns History
                    </h2>
                  </div>
                  <div className="rounded-xl border overflow-hidden overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="thead-rose">
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">Code</TableHead>
                          <TableHead className="text-right font-semibold">
                            GW (g)
                          </TableHead>
                          <TableHead className="text-right font-semibold">
                            SW (g)
                          </TableHead>
                          <TableHead className="text-right font-semibold">
                            NW (g)
                          </TableHead>
                          <TableHead className="text-right font-semibold">
                            PCS
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returnTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center text-muted-foreground py-12"
                              data-ocid="customers.returns.empty_state"
                            >
                              No returns found
                            </TableCell>
                          </TableRow>
                        ) : (
                          returnTransactions.map((tx, idx) => (
                            <TableRow
                              key={Number(tx.id)}
                              className={`hover:bg-destructive/5 transition-colors ${
                                idx % 2 === 0 ? "bg-rose-50/30" : ""
                              }`}
                              data-ocid={`customers.returns.item.${idx + 1}`}
                            >
                              <TableCell className="text-xs">
                                {format(
                                  new Date(Number(tx.timestamp) / 1000000),
                                  "PPp",
                                )}
                              </TableCell>
                              <TableCell className="font-mono font-medium">
                                {tx.item.code}
                              </TableCell>
                              <TableCell className="text-right text-rose-800 font-medium">
                                {tx.item.grossWeight.toFixed(3)}
                              </TableCell>
                              <TableCell className="text-right text-rose-700">
                                {tx.item.stoneWeight.toFixed(3)}
                              </TableCell>
                              <TableCell className="text-right text-rose-700">
                                {tx.item.netWeight.toFixed(3)}
                              </TableCell>
                              <TableCell className="text-right text-rose-800">
                                {Number(tx.item.pieces)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Party Ledger */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-soft section-card-violet">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-5 rounded-full bg-primary" />
                    <h2 className="font-display font-semibold text-sm text-foreground">
                      Party Ledger
                    </h2>
                  </div>
                  {ledgerRows.length === 0 ? (
                    <p
                      className="text-center text-muted-foreground text-sm py-8"
                      data-ocid="customers.ledger.empty_state"
                    >
                      No transactions yet
                    </p>
                  ) : (
                    <div className="rounded-xl border overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="thead-violet">
                              <TableHead className="font-semibold">
                                Date
                              </TableHead>
                              <TableHead className="font-semibold">
                                Type
                              </TableHead>
                              <TableHead className="font-semibold">
                                Code
                              </TableHead>
                              <TableHead className="text-right font-semibold">
                                GW
                              </TableHead>
                              <TableHead className="text-right font-semibold">
                                NW
                              </TableHead>
                              <TableHead className="text-right font-semibold">
                                CALCULATION
                              </TableHead>
                              <TableHead className="text-right font-semibold">
                                PURE WT
                              </TableHead>
                              <TableHead className="text-right font-semibold">
                                AMOUNT
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ledgerRows.map((row, idx) => (
                              <TableRow
                                key={`ledger-${row.date}-${row.code}-${idx}`}
                                className={`transition-colors ${
                                  idx % 2 === 0 ? "bg-violet-50/30" : ""
                                } ${
                                  row.type === "sale"
                                    ? "hover:bg-success/5"
                                    : "hover:bg-destructive/5"
                                }`}
                                data-ocid={`customers.ledger.item.${idx + 1}`}
                              >
                                <TableCell className="text-xs">
                                  {row.date}
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                      row.type === "sale"
                                        ? "bg-success/10 text-success"
                                        : "bg-destructive/10 text-destructive"
                                    }`}
                                  >
                                    {row.type === "sale" ? "Sale" : "Return"}
                                  </span>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {row.code}
                                </TableCell>
                                <TableCell className="text-right text-sm font-medium text-violet-800">
                                  {row.gw.toFixed(3)}
                                </TableCell>
                                <TableCell className="text-right text-sm text-violet-700">
                                  {row.nw.toFixed(3)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.metalPurity != null ? (
                                    <span className="text-amber-700 font-semibold">
                                      {row.metalPurity.toFixed(2)}%
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.metalBalance != null ? (
                                    <span className="text-emerald-700 font-semibold">
                                      {row.metalBalance.toFixed(3)}g
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.cashBalance != null ? (
                                    <span className="text-primary font-bold">
                                      ₹{row.cashBalance.toFixed(0)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Rename Dialog */}
          <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
            <DialogContent data-ocid="customers.dialog">
              <DialogHeader>
                <DialogTitle>Rename Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <p className="text-sm text-muted-foreground">
                  Renaming <strong>{renameTarget}</strong>. Leave blank to
                  assign to own stock.
                </p>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="rename-input"
                    className="text-xs font-semibold uppercase tracking-wide"
                  >
                    New Name
                  </Label>
                  <Input
                    id="rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="Enter new name or leave blank for own stock…"
                    data-ocid="customers.input"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setRenameDialogOpen(false)}
                  disabled={renameCustomer.isPending}
                  data-ocid="customers.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRenameSave}
                  disabled={renameCustomer.isPending}
                  className="gap-2"
                  data-ocid="customers.save_button"
                >
                  {renameCustomer.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
