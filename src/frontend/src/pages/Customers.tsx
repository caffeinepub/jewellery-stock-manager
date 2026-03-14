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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  ChevronRight,
  Download,
  Edit2,
  FileSpreadsheet,
  FileText,
  Loader2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Customer, ItemType, TransactionRecord } from "../backend";
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
  pcs: number;
  metalPurity: number | undefined;
  metalBalance: number | undefined;
  cashBalance: number | undefined;
}

function buildLedgerRows(txs: TransactionRecord[]): LedgerRow[] {
  return txs
    .slice()
    .sort((a, b) => Number(a.timestamp - b.timestamp))
    .map((tx) => {
      const isSale = matchesType(tx.transactionType, "sale");
      return {
        date: format(new Date(Number(tx.timestamp) / 1000000), "dd MMM yyyy"),
        type: isSale ? "sale" : "salesReturn",
        code: tx.item.code,
        gw: tx.item.grossWeight,
        nw: tx.item.netWeight,
        pcs: Number(tx.item.pieces),
        metalPurity: tx.metalPurity,
        metalBalance: tx.metalBalance,
        cashBalance: tx.cashBalance,
      };
    });
}

function exportProFormaInvoice(custName: string, rows: LedgerRow[]) {
  const html = `<!DOCTYPE html><html><head><title>Pro-Forma Invoice - ${custName}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 24px; font-size: 13px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 15px; color: #555; margin-bottom: 20px; font-weight: normal; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #6c47ff; color: white; padding: 8px 10px; text-align: left; font-size: 12px; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #f9f7ff; }
  .badge-sale { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
  .badge-return { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
</style></head><body>
<h1>Pro-Forma Invoice</h1>
<h2>Customer: ${custName} &nbsp;|&nbsp; Date: ${new Date().toLocaleDateString("en-IN")}</h2>
<table>
  <thead><tr><th>Date</th><th>Type</th><th>Code</th><th>GW (g)</th><th>NW (g)</th><th>Calculation %</th><th>Pure Wt (g)</th><th>Amount (₹)</th></tr></thead>
  <tbody>
    ${rows
      .map(
        (r) => `<tr>
      <td>${r.date}</td>
      <td><span class="${r.type === "sale" ? "badge-sale" : "badge-return"}">${r.type === "sale" ? "Sale" : "Return"}</span></td>
      <td><strong>${r.code}</strong></td>
      <td>${r.gw.toFixed(3)}</td>
      <td>${r.nw.toFixed(3)}</td>
      <td>${r.metalPurity != null ? `${r.metalPurity.toFixed(2)}%` : "—"}</td>
      <td>${r.metalBalance != null ? r.metalBalance.toFixed(3) : "—"}</td>
      <td>${r.cashBalance != null ? `₹${r.cashBalance.toFixed(0)}` : "—"}</td>
    </tr>`,
      )
      .join("")}
  </tbody>
</table>
<script>window.onload = function(){ window.print(); }</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

function exportOrderConfirmation(custName: string, rows: LedgerRow[]) {
  const html = `<!DOCTYPE html><html><head><title>Order Confirmation - ${custName}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 24px; font-size: 13px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 15px; color: #555; margin-bottom: 20px; font-weight: normal; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #0ea5e9; color: white; padding: 8px 10px; text-align: left; font-size: 12px; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #f0f9ff; }
  .badge-sale { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
  .badge-return { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
</style></head><body>
<h1>Order Confirmation</h1>
<h2>Customer: ${custName} &nbsp;|&nbsp; Date: ${new Date().toLocaleDateString("en-IN")}</h2>
<table>
  <thead><tr><th>Date</th><th>Type</th><th>Code</th><th>GW (g)</th><th>NW (g)</th><th>PCS</th></tr></thead>
  <tbody>
    ${rows
      .map(
        (r) => `<tr>
      <td>${r.date}</td>
      <td><span class="${r.type === "sale" ? "badge-sale" : "badge-return"}">${r.type === "sale" ? "Sale" : "Return"}</span></td>
      <td><strong>${r.code}</strong></td>
      <td>${r.gw.toFixed(3)}</td>
      <td>${r.nw.toFixed(3)}</td>
      <td>${r.pcs}</td>
    </tr>`,
      )
      .join("")}
  </tbody>
</table>
<script>window.onload = function(){ window.print(); }</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

// Isolated component: receives ONE customer and renders all its data
function CustomerView({
  customer,
  onRename,
}: {
  customer: Customer;
  onRename: (name: string) => void;
}) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  const { salesTransactions, returnTransactions } = useMemo(() => {
    let filtered = customer.transactionHistory;

    if (dateRange.from) {
      const fromTs = BigInt(dateRange.from.getTime() * 1000000);
      filtered = filtered.filter((tx) => tx.timestamp >= fromTs);
    }
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      const toTs = BigInt(toDate.getTime() * 1000000);
      filtered = filtered.filter((tx) => tx.timestamp <= toTs);
    }

    const sales = filtered.filter((tx) =>
      matchesType(tx.transactionType, "sale"),
    );
    const returns = filtered.filter((tx) =>
      matchesType(tx.transactionType, "salesReturn"),
    );
    return { salesTransactions: sales, returnTransactions: returns };
  }, [customer.transactionHistory, dateRange]);

  const customerTotals = useMemo(
    () => ({
      salesCount: salesTransactions.length,
      returnsCount: returnTransactions.length,
      totalGW: salesTransactions.reduce((s, tx) => s + tx.item.grossWeight, 0),
      totalPCS: salesTransactions.reduce(
        (s, tx) => s + Number(tx.item.pieces),
        0,
      ),
    }),
    [salesTransactions, returnTransactions],
  );

  const ledgerRows = useMemo(
    () => buildLedgerRows([...salesTransactions, ...returnTransactions]),
    [salesTransactions, returnTransactions],
  );

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">
          {customer.name}
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
          onClick={() => onRename(customer.name)}
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
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {dateRange.from ? format(dateRange.from, "PP") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) =>
                    setDateRange((r) => ({ ...r, from: date }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {dateRange.to ? format(dateRange.to, "PP") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange((r) => ({ ...r, to: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(dateRange.from || dateRange.to) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setDateRange({ from: undefined, to: undefined })}
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
                <TableHead className="text-right font-semibold">PCS</TableHead>
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
                      {format(new Date(Number(tx.timestamp) / 1000000), "PPp")}
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

      {/* Sales Returns History */}
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
                <TableHead className="text-right font-semibold">PCS</TableHead>
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
                      {format(new Date(Number(tx.timestamp) / 1000000), "PPp")}
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 rounded-full bg-primary" />
            <h2 className="font-display font-semibold text-sm text-foreground">
              Party Ledger
            </h2>
          </div>
          {ledgerRows.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  data-ocid="customers.ledger.open_modal_button"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onClick={() =>
                    exportProFormaInvoice(customer.name, ledgerRows)
                  }
                  className="gap-2 cursor-pointer"
                  data-ocid="customers.ledger.button"
                >
                  <FileText className="w-4 h-4 text-primary" />
                  Pro-Forma Invoice
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    exportOrderConfirmation(customer.name, ledgerRows)
                  }
                  className="gap-2 cursor-pointer"
                  data-ocid="customers.ledger.secondary_button"
                >
                  <FileSpreadsheet className="w-4 h-4 text-success" />
                  Order Confirmation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Code</TableHead>
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
                      <TableCell className="text-xs">{row.date}</TableCell>
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
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.metalBalance != null ? (
                          <span className="text-emerald-700 font-semibold">
                            {row.metalBalance.toFixed(3)}g
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.cashBalance != null ? (
                          <span className="text-primary font-bold">
                            ₹{row.cashBalance.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
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
    </div>
  );
}

export default function Customers() {
  const [selectedCustomerName, setSelectedCustomerName] = useState<
    string | null
  >(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState("");
  const [renameValue, setRenameValue] = useState("");

  const { data: customers, isLoading } = useCustomers();
  const renameCustomer = useRenameCustomer();

  // Active customer: selected or first
  const activeCustomerName =
    selectedCustomerName ?? customers?.[0]?.name ?? null;
  const activeCustomer = customers?.find((c) => c.name === activeCustomerName);

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
    if (selectedCustomerName === renameTarget) {
      setSelectedCustomerName(renameValue.trim() || null);
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
          {/* Customer Selector Dropdown */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-semibold text-foreground shrink-0">
                Select Customer
              </Label>
              <div className="relative flex-1 max-w-xs">
                <select
                  className="w-full appearance-none rounded-xl border-2 border-primary/30 bg-primary/5 text-foreground font-semibold text-sm px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer transition-colors hover:border-primary/50"
                  value={activeCustomerName ?? ""}
                  onChange={(e) => setSelectedCustomerName(e.target.value)}
                  data-ocid="customers.select"
                >
                  {customers.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none rotate-90" />
              </div>
              <span className="text-xs text-muted-foreground">
                {customers.length} customer{customers.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Selected Customer Content */}
          {activeCustomer ? (
            <CustomerView
              key={activeCustomer.name}
              customer={activeCustomer}
              onRename={handleRenameOpen}
            />
          ) : (
            <Card className="shadow-soft">
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  Select a customer above to view their details.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent data-ocid="customers.dialog">
          <DialogHeader>
            <DialogTitle>Rename Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Renaming <strong>{renameTarget}</strong>. Leave blank to assign to
              own stock.
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
    </div>
  );
}
