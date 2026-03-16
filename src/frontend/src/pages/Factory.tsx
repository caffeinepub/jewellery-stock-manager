import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ChevronDown,
  Download,
  Factory as FactoryIcon,
  FileSpreadsheet,
  FileText,
  Filter,
  MinusCircle,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { TransactionRecord } from "../backend";
import { useFactoryLedger } from "../hooks/useQueries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetalPaidEntry {
  id: string;
  date: string;
  grossWeight: number;
  purity: number;
  pureWt: number;
}

interface AmountPaidEntry {
  id: string;
  date: string;
  amount: number;
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

const MP_KEY = "metalPaid_v1_factory";
const AP_KEY = "amountPaid_v1_factory";

function loadMetalPaid(): MetalPaidEntry[] {
  try {
    const s = localStorage.getItem(MP_KEY);
    return s ? (JSON.parse(s) as MetalPaidEntry[]) : [];
  } catch {
    return [];
  }
}

function saveMetalPaid(entries: MetalPaidEntry[]) {
  localStorage.setItem(MP_KEY, JSON.stringify(entries));
}

function loadAmountPaid(): AmountPaidEntry[] {
  try {
    const s = localStorage.getItem(AP_KEY);
    return s ? (JSON.parse(s) as AmountPaidEntry[]) : [];
  } catch {
    return [];
  }
}

function saveAmountPaid(entries: AmountPaidEntry[]) {
  localStorage.setItem(AP_KEY, JSON.stringify(entries));
}

// ─── Ledger row type ──────────────────────────────────────────────────────────

type LedgerRowType = "purchase" | "purchaseReturn" | "metalPaid" | "amountPaid";

interface LedgerRow {
  id: string;
  date: string;
  type: LedgerRowType;
  code?: string;
  gw?: number;
  nw?: number;
  sw?: number;
  pcs?: number;
  calculation?: string;
  pureWt?: number;
  stoneCharges?: number;
}

function buildLedgerRows(
  transactions: TransactionRecord[],
  metalPaid: MetalPaidEntry[],
  amountPaid: AmountPaidEntry[],
): LedgerRow[] {
  const txRows: LedgerRow[] = transactions.map((t) => {
    const isPurchase =
      typeof t.transactionType === "string"
        ? t.transactionType === "purchase"
        : Object.keys(t.transactionType as object)[0] === "purchase";
    const isReturn = !isPurchase;

    const gw = t.item.grossWeight;
    const nw = t.item.netWeight;
    const sw = t.item.stoneWeight;
    const isStone = sw > 0;

    const purity = isStone ? 95.0 : 94.5;
    const rawPureWt = nw * (purity / 100);
    const pureWt = isReturn ? -rawPureWt : rawPureWt;
    const rawStoneCharges = isStone ? sw * 1000 : 0;
    const stoneCharges = isReturn ? -rawStoneCharges : rawStoneCharges;

    return {
      id: `tx_${String(t.id)}_${t.item.code}`,
      date: format(new Date(Number(t.timestamp) / 1_000_000), "dd MMM yyyy"),
      type: isPurchase ? "purchase" : "purchaseReturn",
      code: t.item.code,
      gw,
      nw,
      sw,
      pcs: Number(t.item.pieces),
      calculation: purity.toFixed(2),
      pureWt,
      stoneCharges,
    };
  });

  const mpRows: LedgerRow[] = metalPaid.map((mp) => ({
    id: `mp_${mp.id}`,
    date: mp.date,
    type: "metalPaid",
    gw: mp.grossWeight,
    pureWt: -mp.pureWt,
    calculation: `${mp.purity}%`,
    stoneCharges: 0,
  }));

  const apRows: LedgerRow[] = amountPaid.map((ap) => ({
    id: `ap_${ap.id}`,
    date: ap.date,
    type: "amountPaid",
    stoneCharges: -ap.amount,
    pureWt: 0,
  }));

  return [...txRows, ...mpRows, ...apRows].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
}

// ─── Row color helper ─────────────────────────────────────────────────────────

function rowBg(type: LedgerRowType, idx: number) {
  if (type === "metalPaid") return "bg-amber-50 border-l-4 border-amber-400";
  if (type === "amountPaid")
    return "bg-emerald-50 border-l-4 border-emerald-400";
  if (type === "purchaseReturn") return "bg-rose-50 border-l-4 border-rose-400";
  return idx % 2 === 0 ? "bg-indigo-50" : "bg-violet-50";
}

function typeBadge(type: LedgerRowType) {
  switch (type) {
    case "purchase":
      return (
        <Badge className="bg-indigo-600 text-white hover:bg-indigo-700">
          Purchase
        </Badge>
      );
    case "purchaseReturn":
      return (
        <Badge className="bg-rose-500 text-white hover:bg-rose-600">
          Return
        </Badge>
      );
    case "metalPaid":
      return (
        <Badge className="bg-amber-500 text-white hover:bg-amber-600">
          Metal Paid
        </Badge>
      );
    case "amountPaid":
      return (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
          Amt Paid
        </Badge>
      );
  }
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function exportFactoryCSV(
  rows: LedgerRow[],
  totalPureBalance: number,
  totalCashBalance: number,
  mode: "proforma" | "orderconfirm",
) {
  const lines: string[] = [];
  const ts = format(new Date(), "dd-MMM-yyyy");

  if (mode === "proforma") {
    lines.push("Factory Ledger - Pro-Forma Invoice,,,,,,,");
    lines.push(`Date Generated: ${ts},,,,,,`);
    lines.push("");
    lines.push(
      "Date,Type,Code,GW (g),NW (g),Calc %,Pure Wt (g),Stone Charges (₹)",
    );
    for (const r of rows) {
      lines.push(
        [
          r.date,
          r.type,
          r.code ?? "",
          r.gw != null ? r.gw.toFixed(3) : "",
          r.nw != null ? r.nw.toFixed(3) : "",
          r.calculation ?? "",
          r.pureWt != null ? r.pureWt.toFixed(3) : "",
          r.stoneCharges != null && r.stoneCharges !== 0
            ? r.stoneCharges.toFixed(0)
            : "",
        ].join(","),
      );
    }
    lines.push("");
    lines.push("BALANCE SUMMARY");
    lines.push(`Total Pure Balance Owed (g),${totalPureBalance.toFixed(3)}`);
    lines.push(`Total Cash Balance Owed (₹),${totalCashBalance.toFixed(0)}`);
  } else {
    lines.push("Factory Ledger - Order Confirmation,,,");
    lines.push(`Date Generated: ${ts},,,`);
    lines.push("");
    lines.push("Date,Type,Code,GW (g),NW (g),Pieces");
    for (const r of rows) {
      if (r.type === "purchase" || r.type === "purchaseReturn") {
        lines.push(
          [
            r.date,
            r.type === "purchase" ? "Purchase" : "Return",
            r.code ?? "",
            r.gw != null ? r.gw.toFixed(3) : "",
            r.nw != null ? r.nw.toFixed(3) : "",
            r.pcs != null ? r.pcs : "",
          ].join(","),
        );
      }
    }
  }

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `factory-ledger-${mode}-${ts}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Factory() {
  const { data: transactions, isLoading } = useFactoryLedger();

  // Date filter
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Metal Paid state
  const [metalPaidEntries, setMetalPaidEntries] =
    useState<MetalPaidEntry[]>(loadMetalPaid);
  const [showMPForm, setShowMPForm] = useState(false);
  const [mpDate, setMpDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mpGW, setMpGW] = useState("");
  const [mpPurity, setMpPurity] = useState("94.50");

  // Amount Paid state
  const [amountPaidEntries, setAmountPaidEntries] =
    useState<AmountPaidEntry[]>(loadAmountPaid);
  const [showAPForm, setShowAPForm] = useState(false);
  const [apDate, setApDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [apAmount, setApAmount] = useState("");

  // Derived ledger (all rows)
  const allLedgerRows = useMemo(
    () =>
      buildLedgerRows(transactions ?? [], metalPaidEntries, amountPaidEntries),
    [transactions, metalPaidEntries, amountPaidEntries],
  );

  // Date-filtered ledger
  const ledgerRows = useMemo(() => {
    if (!startDate && !endDate) return allLedgerRows;
    return allLedgerRows.filter((r) => {
      // rows have dates like "15 Mar 2026" — parse via Date
      const d = new Date(r.date);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(`${endDate}T23:59:59`)) return false;
      return true;
    });
  }, [allLedgerRows, startDate, endDate]);

  // Summary totals (based on ALL rows, not filtered)
  const totalPurchaseGW = (transactions ?? []).reduce((s, t) => {
    const isPurchase =
      typeof t.transactionType === "string"
        ? t.transactionType === "purchase"
        : Object.keys(t.transactionType as object)[0] === "purchase";
    return isPurchase ? s + t.item.grossWeight : s;
  }, 0);

  const totalPurchasePCS = (transactions ?? []).reduce((s, t) => {
    const isPurchase =
      typeof t.transactionType === "string"
        ? t.transactionType === "purchase"
        : Object.keys(t.transactionType as object)[0] === "purchase";
    return isPurchase ? s + Number(t.item.pieces) : s;
  }, 0);

  const totalPureBalance = allLedgerRows.reduce(
    (s, r) => s + (r.pureWt ?? 0),
    0,
  );
  const totalCashBalance = allLedgerRows.reduce(
    (s, r) => s + (r.stoneCharges ?? 0),
    0,
  );

  // Metal Paid handlers
  function addMetalPaid() {
    const gw = Number.parseFloat(mpGW);
    const pur = Number.parseFloat(mpPurity);
    if (!mpDate || Number.isNaN(gw) || gw <= 0 || Number.isNaN(pur) || pur <= 0)
      return;
    const entry: MetalPaidEntry = {
      id: `${Date.now()}`,
      date: mpDate,
      grossWeight: gw,
      purity: pur,
      pureWt: gw * (pur / 100),
    };
    const updated = [...metalPaidEntries, entry];
    setMetalPaidEntries(updated);
    saveMetalPaid(updated);
    setMpGW("");
    setShowMPForm(false);
  }

  function removeMetalPaid(id: string) {
    const updated = metalPaidEntries.filter((e) => e.id !== id);
    setMetalPaidEntries(updated);
    saveMetalPaid(updated);
  }

  // Amount Paid handlers
  function addAmountPaid() {
    const amt = Number.parseFloat(apAmount);
    if (!apDate || Number.isNaN(amt) || amt <= 0) return;
    const entry: AmountPaidEntry = {
      id: `${Date.now()}`,
      date: apDate,
      amount: amt,
    };
    const updated = [...amountPaidEntries, entry];
    setAmountPaidEntries(updated);
    saveAmountPaid(updated);
    setApAmount("");
    setShowAPForm(false);
  }

  function removeAmountPaid(id: string) {
    const updated = amountPaidEntries.filter((e) => e.id !== id);
    setAmountPaidEntries(updated);
    saveAmountPaid(updated);
  }

  const mpGWNum = Number.parseFloat(mpGW);
  const mpPurityNum = Number.parseFloat(mpPurity);
  const mpPreviewPure =
    !Number.isNaN(mpGWNum) && !Number.isNaN(mpPurityNum) && mpGWNum > 0
      ? mpGWNum * (mpPurityNum / 100)
      : null;

  return (
    <div className="space-y-6 px-1">
      {/* Header */}
      <div className="mb-4 border-b pb-4">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FactoryIcon className="h-8 w-8 text-indigo-600" />
          Factory Ledger
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Plain: 94.50% purity · Stone: 95% purity + ₹1000/g stone charges
        </p>
      </div>

      {/* ── TOP SECTION: Summary cards ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-0">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-semibold opacity-80 uppercase tracking-wide">
              Total Purchase GW
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold">
              {totalPurchaseGW.toFixed(3)}g
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500 to-violet-700 text-white border-0">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-semibold opacity-80 uppercase tracking-wide">
              Total Pieces
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold">{totalPurchasePCS}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-500 to-teal-700 text-white border-0">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-semibold opacity-80 uppercase tracking-wide">
              Pure Balance Owed
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold">
              {totalPureBalance.toFixed(3)}g
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500 to-rose-700 text-white border-0">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-semibold opacity-80 uppercase tracking-wide">
              Cash Balance Owed
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold">
              ₹{totalCashBalance.toFixed(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Metal Paid Section (above ledger) ── */}
      <Card className="border border-amber-300 shadow-md">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-lg py-3 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-white text-lg">
            Metal Paid to Factory
          </CardTitle>
          <Button
            data-ocid="factory.metal_paid_button"
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/40"
            onClick={() => setShowMPForm((v) => !v)}
          >
            {showMPForm ? (
              <MinusCircle className="h-4 w-4 mr-1" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-1" />
            )}
            {showMPForm ? "Cancel" : "Add Entry"}
          </Button>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {showMPForm && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-amber-800">
                    Date
                  </Label>
                  <Input
                    data-ocid="factory.metal_paid.date_input"
                    type="date"
                    value={mpDate}
                    onChange={(e) => setMpDate(e.target.value)}
                    className="border-amber-300 focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-amber-800">
                    Gross Weight (g)
                  </Label>
                  <Input
                    data-ocid="factory.metal_paid.gw_input"
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={mpGW}
                    onChange={(e) => setMpGW(e.target.value)}
                    className="border-amber-300 focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-amber-800">
                    Purity (%)
                  </Label>
                  <Input
                    data-ocid="factory.metal_paid.purity_input"
                    type="number"
                    step="0.01"
                    placeholder="94.50"
                    value={mpPurity}
                    onChange={(e) => setMpPurity(e.target.value)}
                    className="border-amber-300 focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-amber-800">
                    Pure Wt (auto)
                  </Label>
                  <div className="h-10 flex items-center px-3 bg-amber-100 rounded border border-amber-300 text-sm font-semibold text-amber-800">
                    {mpPreviewPure != null
                      ? `${mpPreviewPure.toFixed(3)}g`
                      : "—"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  data-ocid="factory.metal_paid.save_button"
                  onClick={addMetalPaid}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Save Entry
                </Button>
                <Button
                  data-ocid="factory.metal_paid.cancel_button"
                  variant="outline"
                  onClick={() => setShowMPForm(false)}
                  className="border-amber-400 text-amber-700 hover:bg-amber-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {metalPaidEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No metal paid entries yet
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-amber-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-amber-50">
                    <TableHead className="text-amber-800 font-bold">
                      Date
                    </TableHead>
                    <TableHead className="text-right text-amber-800 font-bold">
                      GW (g)
                    </TableHead>
                    <TableHead className="text-right text-amber-800 font-bold">
                      Purity (%)
                    </TableHead>
                    <TableHead className="text-right text-amber-800 font-bold">
                      Pure Wt (g)
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metalPaidEntries.map((entry, idx) => (
                    <TableRow
                      key={entry.id}
                      data-ocid={`factory.metal_paid.item.${idx + 1}`}
                      className={idx % 2 === 0 ? "bg-white" : "bg-amber-50/50"}
                    >
                      <TableCell>{entry.date}</TableCell>
                      <TableCell className="text-right">
                        {entry.grossWeight.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.purity.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-teal-700">
                        {entry.pureWt.toFixed(3)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-500 hover:text-rose-700"
                          onClick={() => removeMetalPaid(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Amount Paid Section (above ledger) ── */}
      <Card className="border border-emerald-300 shadow-md">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-t-lg py-3 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-white text-lg">
            Amount Paid to Factory
          </CardTitle>
          <Button
            data-ocid="factory.amount_paid_button"
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/40"
            onClick={() => setShowAPForm((v) => !v)}
          >
            {showAPForm ? (
              <MinusCircle className="h-4 w-4 mr-1" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-1" />
            )}
            {showAPForm ? "Cancel" : "Add Entry"}
          </Button>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {showAPForm && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-emerald-800">
                    Date
                  </Label>
                  <Input
                    data-ocid="factory.amount_paid.date_input"
                    type="date"
                    value={apDate}
                    onChange={(e) => setApDate(e.target.value)}
                    className="border-emerald-300 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-emerald-800">
                    Amount (₹)
                  </Label>
                  <Input
                    data-ocid="factory.amount_paid.amount_input"
                    type="number"
                    step="1"
                    placeholder="0"
                    value={apAmount}
                    onChange={(e) => setApAmount(e.target.value)}
                    className="border-emerald-300 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  data-ocid="factory.amount_paid.save_button"
                  onClick={addAmountPaid}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Save Entry
                </Button>
                <Button
                  data-ocid="factory.amount_paid.cancel_button"
                  variant="outline"
                  onClick={() => setShowAPForm(false)}
                  className="border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {amountPaidEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No amount paid entries yet
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-emerald-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50">
                    <TableHead className="text-emerald-800 font-bold">
                      Date
                    </TableHead>
                    <TableHead className="text-right text-emerald-800 font-bold">
                      Amount (₹)
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {amountPaidEntries.map((entry, idx) => (
                    <TableRow
                      key={entry.id}
                      data-ocid={`factory.amount_paid.item.${idx + 1}`}
                      className={
                        idx % 2 === 0 ? "bg-white" : "bg-emerald-50/50"
                      }
                    >
                      <TableCell>{entry.date}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-700">
                        ₹{entry.amount.toFixed(0)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-500 hover:text-rose-700"
                          onClick={() => removeAmountPaid(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Date Filter + Export Bar ── */}
      <div className="flex flex-wrap items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
        <Filter className="w-4 h-4 text-indigo-500 shrink-0" />
        <Label className="text-xs font-semibold text-indigo-700">
          Filter Ledger
        </Label>
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input
            data-ocid="factory.date_from.input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8 text-xs w-36"
          />
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            data-ocid="factory.date_to.input"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8 text-xs w-36"
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs text-indigo-600 underline hover:text-indigo-800"
            >
              Clear
            </button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-ocid="factory.export.open_modal_button"
              variant="outline"
              size="sm"
              className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() =>
                exportFactoryCSV(
                  ledgerRows,
                  totalPureBalance,
                  totalCashBalance,
                  "proforma",
                )
              }
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              Pro-Forma Invoice
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() =>
                exportFactoryCSV(
                  ledgerRows,
                  totalPureBalance,
                  totalCashBalance,
                  "orderconfirm",
                )
              }
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              Order Confirmation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Factory Ledger Table ── */}
      <Card className="border border-indigo-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-lg py-3 px-4">
          <CardTitle className="text-white text-lg">
            Transaction Ledger
            {(startDate || endDate) && (
              <span className="text-xs font-normal opacity-80 ml-2">
                (filtered)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-indigo-50">
                    <TableHead className="font-bold text-indigo-900">
                      Date
                    </TableHead>
                    <TableHead className="font-bold text-indigo-900">
                      Type
                    </TableHead>
                    <TableHead className="font-bold text-indigo-900">
                      Code
                    </TableHead>
                    <TableHead className="text-right font-bold text-indigo-900">
                      GW (g)
                    </TableHead>
                    <TableHead className="text-right font-bold text-indigo-900">
                      NW (g)
                    </TableHead>
                    <TableHead className="text-right font-bold text-indigo-900">
                      Calc %
                    </TableHead>
                    <TableHead className="text-right font-bold text-indigo-900">
                      Pure Wt (g)
                    </TableHead>
                    <TableHead className="text-right font-bold text-indigo-900">
                      Stone Charges (₹)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground py-10"
                      >
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledgerRows.map((row, idx) => (
                      <TableRow key={row.id} className={rowBg(row.type, idx)}>
                        <TableCell className="text-sm">{row.date}</TableCell>
                        <TableCell>{typeBadge(row.type)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {row.code ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {row.gw != null ? row.gw.toFixed(3) : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {row.nw != null ? row.nw.toFixed(3) : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {row.calculation ?? "—"}
                        </TableCell>
                        <TableCell
                          className={`text-right text-sm font-semibold ${
                            (row.pureWt ?? 0) < 0
                              ? "text-rose-600"
                              : "text-teal-700"
                          }`}
                        >
                          {row.pureWt != null
                            ? `${row.pureWt.toFixed(3)}g`
                            : "—"}
                        </TableCell>
                        <TableCell
                          className={`text-right text-sm font-semibold ${
                            (row.stoneCharges ?? 0) < 0
                              ? "text-rose-600"
                              : "text-violet-700"
                          }`}
                        >
                          {row.stoneCharges != null
                            ? row.stoneCharges === 0
                              ? "—"
                              : `₹${row.stoneCharges.toFixed(0)}`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-teal-400 to-teal-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-semibold opacity-90 uppercase tracking-wide">
              Total Pure Balance Owed
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-bold">
              {totalPureBalance.toFixed(3)}g
            </div>
            <div className="text-xs opacity-75 mt-1">
              Purchases − Returns − Metal Paid
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500 to-violet-700 text-white border-0 shadow-lg">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-semibold opacity-90 uppercase tracking-wide">
              Total Cash Balance Owed
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-bold">
              ₹{totalCashBalance.toFixed(0)}
            </div>
            <div className="text-xs opacity-75 mt-1">
              Stone Charges − Amount Paid
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
