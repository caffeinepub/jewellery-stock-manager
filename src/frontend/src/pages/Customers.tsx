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
  Plus,
  Scale,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Customer, ItemType, TransactionRecord } from "../backend";
import { useCustomers, useRenameCustomer } from "../hooks/useQueries";

function matchesType(txType: ItemType, expectedKey: string): boolean {
  if (typeof txType === "string") return (txType as string) === expectedKey;
  return Object.keys(txType as unknown as object)[0] === expectedKey;
}

// ── Metal Received ──────────────────────────────────────────────────────────
interface MetalReceivedEntry {
  id: string;
  date: string; // ISO date string yyyy-MM-dd
  grossWeight: number;
  purity: number; // 95–100 as entered (percent)
  pureWeight: number; // gw * (purity / 100)
}

function mrKey(customerName: string) {
  return `metalRcvd_v1_${customerName}`;
}

function loadMetalReceived(customerName: string): MetalReceivedEntry[] {
  try {
    const stored = localStorage.getItem(mrKey(customerName));
    return stored ? (JSON.parse(stored) as MetalReceivedEntry[]) : [];
  } catch {
    return [];
  }
}

function saveMetalReceived(
  customerName: string,
  entries: MetalReceivedEntry[],
) {
  localStorage.setItem(mrKey(customerName), JSON.stringify(entries));
}

// ── Cash Received ──────────────────────────────────────────────────────────
interface CashReceivedEntry {
  id: string;
  date: string; // yyyy-MM-dd
  amount: number; // cash amount in Rs
}

function crKey(customerName: string) {
  return `cashRcvd_v1_${customerName}`;
}

function loadCashReceived(customerName: string): CashReceivedEntry[] {
  try {
    const stored = localStorage.getItem(crKey(customerName));
    return stored ? (JSON.parse(stored) as CashReceivedEntry[]) : [];
  } catch {
    return [];
  }
}

function saveCashReceived(customerName: string, entries: CashReceivedEntry[]) {
  localStorage.setItem(crKey(customerName), JSON.stringify(entries));
}

// ── Ledger Row ──────────────────────────────────────────────────────────────
interface LedgerRow {
  date: string;
  sortKey: number;
  type: "sale" | "salesReturn" | "metalReceived" | "cashReceived";
  code: string;
  gw: number;
  nw: number;
  pcs: number;
  metalPurity: number | undefined;
  metalBalance: number | undefined;
  cashBalance: number | undefined;
}

function buildLedgerRows(
  txs: TransactionRecord[],
  metalReceived: MetalReceivedEntry[],
  cashReceived: CashReceivedEntry[],
): LedgerRow[] {
  const txRows: LedgerRow[] = txs.map((tx) => {
    const isSale = matchesType(tx.transactionType, "sale");
    const ts = Number(tx.timestamp) / 1000000;
    return {
      date: format(new Date(ts), "dd MMM yyyy"),
      sortKey: ts,
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

  const mrRows: LedgerRow[] = metalReceived.map((mr) => ({
    date: format(new Date(mr.date), "dd MMM yyyy"),
    sortKey: new Date(mr.date).getTime(),
    type: "metalReceived",
    code: "Metal Rcvd",
    gw: mr.grossWeight,
    nw: 0,
    pcs: 0,
    metalPurity: mr.purity,
    metalBalance: mr.pureWeight,
    cashBalance: undefined,
  }));

  const crRows: LedgerRow[] = cashReceived.map((cr) => ({
    date: format(new Date(cr.date), "dd MMM yyyy"),
    sortKey: new Date(cr.date).getTime(),
    type: "cashReceived",
    code: "Cash Rcvd",
    gw: 0,
    nw: 0,
    pcs: 0,
    metalPurity: undefined,
    metalBalance: undefined,
    cashBalance: cr.amount,
  }));

  return [...txRows, ...mrRows, ...crRows].sort(
    (a, b) => a.sortKey - b.sortKey,
  );
}

// ── Balance Summary ─────────────────────────────────────────────────────────
interface BalanceSummary {
  totalPureBalance: number;
  totalCashBalance: number;
}

function computeBalance(rows: LedgerRow[]): BalanceSummary {
  const salePure = rows
    .filter((r) => r.type === "sale" && r.metalBalance != null)
    .reduce((s, r) => s + (r.metalBalance ?? 0), 0);
  const returnPure = rows
    .filter((r) => r.type === "salesReturn" && r.metalBalance != null)
    .reduce((s, r) => s + (r.metalBalance ?? 0), 0);
  const rcvdPure = rows
    .filter((r) => r.type === "metalReceived")
    .reduce((s, r) => s + (r.metalBalance ?? 0), 0);
  const saleCash = rows
    .filter((r) => r.type === "sale" && r.cashBalance != null)
    .reduce((s, r) => s + (r.cashBalance ?? 0), 0);
  const returnCash = rows
    .filter((r) => r.type === "salesReturn" && r.cashBalance != null)
    .reduce((s, r) => s + (r.cashBalance ?? 0), 0);
  const rcvdCash = rows
    .filter((r) => r.type === "cashReceived")
    .reduce((s, r) => s + (r.cashBalance ?? 0), 0);
  return {
    totalPureBalance: salePure - returnPure - rcvdPure,
    totalCashBalance: saleCash - returnCash - rcvdCash,
  };
}

// ── Exports ──────────────────────────────────────────────────────────────────
function exportProFormaInvoice(
  custName: string,
  rows: LedgerRow[],
  balance: BalanceSummary,
) {
  const rowsHtml = rows
    .map(
      (r) => `<tr>
      <td>${r.date}</td>
      <td><span class="badge-${r.type === "sale" ? "sale" : r.type === "salesReturn" ? "return" : r.type === "metalReceived" ? "metal" : "cash"}">${r.type === "sale" ? "Sale" : r.type === "salesReturn" ? "Return" : r.type === "metalReceived" ? "Metal Rcvd" : "Cash Rcvd"}</span></td>
      <td><strong>${r.code}</strong></td>
      <td>${r.type === "cashReceived" ? "—" : r.gw.toFixed(3)}</td>
      <td>${r.type === "metalReceived" || r.type === "cashReceived" ? "—" : r.nw.toFixed(3)}</td>
      <td>${r.metalPurity != null ? `${r.metalPurity.toFixed(2)}%` : "—"}</td>
      <td>${r.metalBalance != null ? `${r.metalBalance.toFixed(3)}g` : "—"}</td>
      <td>${r.type === "cashReceived" ? `&#8377;${(r.cashBalance ?? 0).toFixed(0)}` : r.cashBalance != null ? `&#8377;${r.cashBalance.toFixed(0)}` : "—"}</td>
    </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>Pro-Forma Invoice - ${custName}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 24px; font-size: 13px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 15px; color: #555; margin-bottom: 20px; font-weight: normal; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  th { background: #6c47ff; color: white; padding: 8px 10px; text-align: left; font-size: 12px; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #f9f7ff; }
  .badge-sale { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
  .badge-return { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
  .badge-metal { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
  .badge-cash { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
  .summary-box { margin-top: 24px; border: 2px solid #6c47ff; border-radius: 8px; padding: 16px; background: #f9f7ff; }
  .summary-box h3 { margin: 0 0 12px; color: #6c47ff; font-size: 14px; }
  .summary-grid { display: flex; gap: 32px; }
  .summary-item { flex: 1; }
  .summary-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 4px; }
  .summary-sublabel { font-size: 10px; color: #aaa; margin-top: 4px; }
  .summary-value { font-size: 20px; font-weight: bold; color: #1a1a1a; }
  .summary-value.positive { color: #065f46; }
  .summary-value.cash { color: #6c47ff; }
</style></head><body>
<h1>Pro-Forma Invoice</h1>
<h2>Customer: ${custName} &nbsp;|&nbsp; Date: ${new Date().toLocaleDateString("en-IN")}</h2>
<table>
  <thead><tr><th>Date</th><th>Type</th><th>Code</th><th>GW (g)</th><th>NW (g)</th><th>Calculation %</th><th>Pure Wt (g)</th><th>Amount (&#8377;)</th></tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>
<div class="summary-box">
  <h3>Balance Summary</h3>
  <div class="summary-grid">
    <div class="summary-item">
      <div class="summary-label">Total Pure Balance</div>
      <div class="summary-value positive">${balance.totalPureBalance.toFixed(3)} g</div>
      <div class="summary-sublabel">Sales &minus; Returns &minus; Metal Rcvd</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Total Cash Balance</div>
      <div class="summary-value cash">&#8377;${balance.totalCashBalance.toFixed(0)}</div>
      <div class="summary-sublabel">Sales &minus; Returns &minus; Cash Rcvd</div>
    </div>
  </div>
</div>
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
  .badge-metal { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
  .badge-cash { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
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
      <td><span class="badge-${r.type === "sale" ? "sale" : r.type === "salesReturn" ? "return" : r.type === "metalReceived" ? "metal" : "cash"}">${r.type === "sale" ? "Sale" : r.type === "salesReturn" ? "Return" : r.type === "metalReceived" ? "Metal Rcvd" : "Cash Rcvd"}</span></td>
      <td><strong>${r.code}</strong></td>
      <td>${r.type === "metalReceived" || r.type === "cashReceived" ? "—" : r.gw.toFixed(3)}</td>
      <td>${r.type === "metalReceived" || r.type === "cashReceived" ? "—" : r.nw.toFixed(3)}</td>
      <td>${r.type === "metalReceived" || r.type === "cashReceived" ? "—" : r.pcs}</td>
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

// ── CustomerView ─────────────────────────────────────────────────────────────
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

  // Metal Received state
  const [metalReceivedEntries, setMetalReceivedEntries] = useState<
    MetalReceivedEntry[]
  >(() => loadMetalReceived(customer.name));
  const [showAddMR, setShowAddMR] = useState(false);
  const [mrDate, setMrDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mrGw, setMrGw] = useState("");
  const [mrPurity, setMrPurity] = useState("");

  const handleAddMR = () => {
    const gw = Number.parseFloat(mrGw);
    const purity = Number.parseFloat(mrPurity);
    if (
      Number.isNaN(gw) ||
      gw <= 0 ||
      Number.isNaN(purity) ||
      purity <= 0 ||
      purity > 100
    )
      return;
    const entry: MetalReceivedEntry = {
      id: `${Date.now()}_${Math.random()}`,
      date: mrDate,
      grossWeight: gw,
      purity,
      pureWeight: gw * (purity / 100),
    };
    const updated = [...metalReceivedEntries, entry];
    setMetalReceivedEntries(updated);
    saveMetalReceived(customer.name, updated);
    setMrGw("");
    setMrPurity("");
    setMrDate(format(new Date(), "yyyy-MM-dd"));
    setShowAddMR(false);
  };

  const handleDeleteMR = (id: string) => {
    const updated = metalReceivedEntries.filter((e) => e.id !== id);
    setMetalReceivedEntries(updated);
    saveMetalReceived(customer.name, updated);
  };

  // Cash Received state
  const [cashReceivedEntries, setCashReceivedEntries] = useState<
    CashReceivedEntry[]
  >(() => loadCashReceived(customer.name));
  const [showAddCR, setShowAddCR] = useState(false);
  const [crDate, setCrDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [crAmount, setCrAmount] = useState("");

  const handleAddCR = () => {
    const amount = Number.parseFloat(crAmount);
    if (Number.isNaN(amount) || amount <= 0) return;
    const entry: CashReceivedEntry = {
      id: `${Date.now()}_${Math.random()}`,
      date: crDate,
      amount,
    };
    const updated = [...cashReceivedEntries, entry];
    setCashReceivedEntries(updated);
    saveCashReceived(customer.name, updated);
    setCrAmount("");
    setCrDate(format(new Date(), "yyyy-MM-dd"));
    setShowAddCR(false);
  };

  const handleDeleteCR = (id: string) => {
    const updated = cashReceivedEntries.filter((e) => e.id !== id);
    setCashReceivedEntries(updated);
    saveCashReceived(customer.name, updated);
  };

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
    () =>
      buildLedgerRows(
        [...salesTransactions, ...returnTransactions],
        metalReceivedEntries,
        cashReceivedEntries,
      ),
    [
      salesTransactions,
      returnTransactions,
      metalReceivedEntries,
      cashReceivedEntries,
    ],
  );

  const balance = useMemo(() => computeBalance(ledgerRows), [ledgerRows]);

  const sortedMetalEntries = useMemo(
    () =>
      metalReceivedEntries
        .slice()
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
    [metalReceivedEntries],
  );

  const sortedCashEntries = useMemo(
    () =>
      cashReceivedEntries
        .slice()
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
    [cashReceivedEntries],
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 rounded-2xl p-4 shadow-soft">
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">
            Total Sales
          </p>
          <p className="text-2xl font-display font-bold text-emerald-900">
            {customerTotals.salesCount}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 rounded-2xl p-4 shadow-soft">
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">
            Total Returns
          </p>
          <p className="text-2xl font-display font-bold text-amber-900">
            {customerTotals.returnsCount}
          </p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-200 rounded-2xl p-4 shadow-soft">
          <p className="text-xs font-medium text-violet-700 uppercase tracking-wide mb-1">
            Total GW (Sales)
          </p>
          <p className="text-2xl font-display font-bold text-violet-900">
            {customerTotals.totalGW.toFixed(2)}g
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl p-4 shadow-soft">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
            Total PCS (Sales)
          </p>
          <p className="text-2xl font-display font-bold text-blue-900">
            {customerTotals.totalPCS}
          </p>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-cyan-100 border border-teal-200 rounded-2xl p-4 shadow-soft">
          <p className="text-xs font-medium text-teal-700 uppercase tracking-wide mb-1">
            Pure Balance
          </p>
          <p
            className={`text-xl font-display font-bold ${
              balance.totalPureBalance >= 0
                ? "text-teal-900"
                : "text-destructive"
            }`}
          >
            {balance.totalPureBalance.toFixed(3)}g
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-4 shadow-soft">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">
            Cash Balance
          </p>
          <p
            className={`text-xl font-display font-bold ${
              balance.totalCashBalance >= 0
                ? "text-green-900"
                : "text-destructive"
            }`}
          >
            ₹{balance.totalCashBalance.toFixed(0)}
          </p>
          <p className="text-xs text-green-600 mt-0.5">
            Sales − Returns − Cash Rcvd
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
                    exportProFormaInvoice(customer.name, ledgerRows, balance)
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
                      key={`ledger-${row.sortKey}-${row.code}-${idx}`}
                      className={`transition-colors ${
                        idx % 2 === 0 ? "bg-violet-50/30" : ""
                      } ${
                        row.type === "sale"
                          ? "hover:bg-success/5"
                          : row.type === "salesReturn"
                            ? "hover:bg-destructive/5"
                            : row.type === "metalReceived"
                              ? "hover:bg-amber-50"
                              : "hover:bg-emerald-50"
                      }`}
                      data-ocid={`customers.ledger.item.${idx + 1}`}
                    >
                      <TableCell className="text-xs">{row.date}</TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            row.type === "sale"
                              ? "bg-success/10 text-success"
                              : row.type === "salesReturn"
                                ? "bg-destructive/10 text-destructive"
                                : row.type === "metalReceived"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {row.type === "sale"
                            ? "Sale"
                            : row.type === "salesReturn"
                              ? "Return"
                              : row.type === "metalReceived"
                                ? "Metal Rcvd"
                                : "Cash Rcvd"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.code}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-violet-800">
                        {row.type === "cashReceived" ? "—" : row.gw.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-violet-700">
                        {row.type === "metalReceived" ||
                        row.type === "cashReceived"
                          ? "—"
                          : row.nw.toFixed(3)}
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
                          <span
                            className={`font-semibold ${
                              row.type === "metalReceived"
                                ? "text-amber-700"
                                : "text-emerald-700"
                            }`}
                          >
                            {row.metalBalance.toFixed(3)}g
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.type === "cashReceived" ? (
                          <span className="text-emerald-700 font-bold">
                            ₹{(row.cashBalance ?? 0).toFixed(0)}
                          </span>
                        ) : row.cashBalance != null ? (
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

        {/* Balance Summary below ledger */}
        {ledgerRows.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-teal-50 to-emerald-100 border border-teal-200 p-4">
              <p className="text-xs font-medium text-teal-700 uppercase tracking-wide mb-1">
                Total Pure Balance
              </p>
              <p
                className={`text-xl font-display font-bold ${
                  balance.totalPureBalance >= 0
                    ? "text-teal-900"
                    : "text-destructive"
                }`}
              >
                {balance.totalPureBalance.toFixed(3)} g
              </p>
              <p className="text-xs text-teal-600 mt-1">
                Sales − Returns − Metal Rcvd
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-200 p-4">
              <p className="text-xs font-medium text-violet-700 uppercase tracking-wide mb-1">
                Total Cash Balance
              </p>
              <p
                className={`text-xl font-display font-bold ${
                  balance.totalCashBalance >= 0
                    ? "text-violet-900"
                    : "text-destructive"
                }`}
              >
                ₹{balance.totalCashBalance.toFixed(0)}
              </p>
              <p className="text-xs text-violet-600 mt-1">
                Sales − Returns − Cash Rcvd
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Metal Received Section */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft section-card-amber">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 rounded-full bg-warning" />
            <h2 className="font-display font-semibold text-sm text-foreground">
              Metal Received
            </h2>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-warning text-warning-foreground hover:bg-warning/90"
            onClick={() => setShowAddMR((v) => !v)}
            data-ocid="customers.metalrcvd.open_modal_button"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Entry
          </Button>
        </div>

        {/* Add form */}
        {showAddMR && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-amber-800">
                  Date
                </Label>
                <Input
                  type="date"
                  value={mrDate}
                  onChange={(e) => setMrDate(e.target.value)}
                  className="text-sm"
                  data-ocid="customers.metalrcvd.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-amber-800">
                  Gross Weight (g)
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 50.000"
                  value={mrGw}
                  onChange={(e) => setMrGw(e.target.value)}
                  className="text-sm"
                  data-ocid="customers.metalrcvd.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-amber-800">
                  Purity % (95–100)
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 97.50"
                  min="1"
                  max="100"
                  value={mrPurity}
                  onChange={(e) => setMrPurity(e.target.value)}
                  className="text-sm"
                  data-ocid="customers.metalrcvd.input"
                />
              </div>
            </div>
            {mrGw && mrPurity && (
              <p className="text-xs text-amber-700 font-medium">
                Pure Wt ={" "}
                {(
                  Number.parseFloat(mrGw) *
                  (Number.parseFloat(mrPurity) / 100)
                ).toFixed(3)}
                g
              </p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddMR}
                className="bg-warning text-warning-foreground hover:bg-warning/90"
                data-ocid="customers.metalrcvd.submit_button"
              >
                <Scale className="w-3.5 h-3.5 mr-1.5" />
                Save Entry
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddMR(false)}
                data-ocid="customers.metalrcvd.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {metalReceivedEntries.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-6">
            No metal received entries yet
          </p>
        ) : (
          <div className="rounded-xl border overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="thead-amber">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="text-right font-semibold">
                    GW (g)
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Purity %
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Pure Wt (g)
                  </TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMetalEntries.map((entry, idx) => (
                  <TableRow
                    key={entry.id}
                    className={`transition-colors hover:bg-amber-50 ${
                      idx % 2 === 0 ? "bg-amber-50/30" : ""
                    }`}
                    data-ocid={`customers.metalrcvd.item.${idx + 1}`}
                  >
                    <TableCell className="text-xs">
                      {format(new Date(entry.date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right font-medium text-amber-800">
                      {entry.grossWeight.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right text-amber-700">
                      {entry.purity.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right font-bold text-amber-900">
                      {entry.pureWeight.toFixed(3)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 h-7 px-2"
                        onClick={() => handleDeleteMR(entry.id)}
                        data-ocid={`customers.metalrcvd.delete_button.${idx + 1}`}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Cash Received Section */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft section-card-green">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 rounded-full bg-success" />
            <h2 className="font-display font-semibold text-sm text-foreground">
              Cash Received
            </h2>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => setShowAddCR((v) => !v)}
            data-ocid="customers.cashrcvd.open_modal_button"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Entry
          </Button>
        </div>

        {/* Add form */}
        {showAddCR && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-emerald-800">
                  Date
                </Label>
                <Input
                  type="date"
                  value={crDate}
                  onChange={(e) => setCrDate(e.target.value)}
                  className="text-sm"
                  data-ocid="customers.cashrcvd.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-emerald-800">
                  Cash Amount (₹)
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={crAmount}
                  onChange={(e) => setCrAmount(e.target.value)}
                  className="text-sm"
                  data-ocid="customers.cashrcvd.input"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddCR}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                data-ocid="customers.cashrcvd.submit_button"
              >
                <Wallet className="w-3.5 h-3.5 mr-1.5" />
                Save Entry
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddCR(false)}
                data-ocid="customers.cashrcvd.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {cashReceivedEntries.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-6">
            No cash received entries yet
          </p>
        ) : (
          <div className="rounded-xl border overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="thead-green">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="text-right font-semibold">
                    Amount (₹)
                  </TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCashEntries.map((entry, idx) => (
                  <TableRow
                    key={entry.id}
                    className={`transition-colors hover:bg-emerald-50 ${
                      idx % 2 === 0 ? "bg-emerald-50/30" : ""
                    }`}
                    data-ocid={`customers.cashrcvd.item.${idx + 1}`}
                  >
                    <TableCell className="text-xs">
                      {format(new Date(entry.date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-900">
                      ₹{entry.amount.toFixed(0)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 h-7 px-2"
                        onClick={() => handleDeleteCR(entry.id)}
                        data-ocid={`customers.cashrcvd.delete_button.${idx + 1}`}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Customers() {
  const [selectedCustomerName, setSelectedCustomerName] = useState<
    string | null
  >(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState("");
  const [renameValue, setRenameValue] = useState("");

  const { data: customers, isLoading } = useCustomers();
  const renameCustomer = useRenameCustomer();

  const activeCustomerName =
    selectedCustomerName ?? customers?.[0]?.name ?? null;
  const activeCustomer = useMemo(
    () => customers?.find((c) => c.name === activeCustomerName),
    [customers, activeCustomerName],
  );

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
