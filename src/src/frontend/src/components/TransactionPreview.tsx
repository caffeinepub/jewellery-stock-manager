import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Calculator,
  Check,
  CheckCircle,
  Edit2,
  Loader2,
  ShoppingCart,
  SkipForward,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ItemType, type TransactionInput } from "../backend";
import { useAddBatchTransactions } from "../hooks/useQueries";
import type { ParsedItem } from "../utils/scannerParser";

interface TransactionPreviewProps {
  items: ParsedItem[];
  transactionType: "sale" | "purchase" | "purchaseReturn" | "salesReturn";
  customerName?: string;
  staffName?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface IndexedItem extends ParsedItem {
  _id: number;
}

interface CalcState {
  stonePurity: number;
  stoneChargePerGram: number;
  nonStonePurity: number;
}

// Saved calc stores the raw inputs so we can compute per-item values directly
interface SavedCalc {
  stonePurity: number;
  nonStonePurity: number;
  stoneChargePerGram: number;
}

function revalidateItem(
  item: Partial<ParsedItem>,
): "VALID" | "MISTAKE" | "INVALID" {
  const gw = item.grossWeight;
  const sw = item.stoneWeight ?? 0;
  const nw = item.netWeight;

  if (gw == null || nw == null || !item.code?.trim()) return "INVALID";

  const gwInt = Math.round(gw * 1000);
  const swInt = Math.round(sw * 1000);
  const nwInt = Math.round(nw * 1000);

  if (gwInt === swInt + nwInt) return "VALID";
  return "MISTAKE";
}

export default function TransactionPreview({
  items,
  transactionType,
  customerName,
  staffName,
  onConfirm,
  onCancel,
}: TransactionPreviewProps) {
  const [localItems, setLocalItems] = useState<IndexedItem[]>(() =>
    items.map((item, i) => ({ ...item, _id: i })),
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<ParsedItem>>({});
  const [showCalcPanel, setShowCalcPanel] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [calcState, setCalcState] = useState<CalcState>({
    stonePurity: 99,
    stoneChargePerGram: 0,
    nonStonePurity: 99,
  });
  const [savedCalc, setSavedCalc] = useState<SavedCalc | null>(null);

  const addBatchTransactions = useAddBatchTransactions();

  const validItems = useMemo(
    () => localItems.filter((i) => i.status === "VALID"),
    [localItems],
  );
  const issueItems = useMemo(
    () => localItems.filter((i) => i.status !== "VALID"),
    [localItems],
  );

  const sortedItems = useMemo(
    () => [...issueItems, ...validItems],
    [issueItems, validItems],
  );

  const totals = useMemo(() => {
    return {
      grossWeight: validItems.reduce((s, i) => s + (i.grossWeight ?? 0), 0),
      stoneWeight: validItems.reduce((s, i) => s + (i.stoneWeight ?? 0), 0),
      netWeight: validItems.reduce((s, i) => s + (i.netWeight ?? 0), 0),
      pieces: validItems.reduce((s, i) => s + (i.pieces ?? 0), 0),
      count: validItems.length,
    };
  }, [validItems]);

  // Split valid items into stone and non-stone groups
  const stoneItems = useMemo(
    () => validItems.filter((i) => (i.stoneWeight ?? 0) > 0),
    [validItems],
  );
  const nonStoneItems = useMemo(
    () => validItems.filter((i) => (i.stoneWeight ?? 0) === 0),
    [validItems],
  );

  const stoneTotals = useMemo(
    () => ({
      gw: stoneItems.reduce((s, i) => s + (i.grossWeight ?? 0), 0),
      sw: stoneItems.reduce((s, i) => s + (i.stoneWeight ?? 0), 0),
      nw: stoneItems.reduce((s, i) => s + (i.netWeight ?? 0), 0),
    }),
    [stoneItems],
  );

  const nonStoneTotals = useMemo(
    () => ({
      gw: nonStoneItems.reduce((s, i) => s + (i.grossWeight ?? 0), 0),
      nw: nonStoneItems.reduce((s, i) => s + (i.netWeight ?? 0), 0),
    }),
    [nonStoneItems],
  );

  const stoneMetalBalance = (stoneTotals.nw * calcState.stonePurity) / 100;
  const stoneCashBalance = stoneTotals.sw * calcState.stoneChargePerGram;
  const nonStoneMetalBalance =
    (nonStoneTotals.nw * calcState.nonStonePurity) / 100;

  const handleEdit = (id: number) => {
    const item = localItems.find((i) => i._id === id);
    if (!item) return;
    setEditingId(id);
    setEditValues({ ...item });
  };

  const handleSaveEdit = () => {
    if (editingId === null) return;
    const newStatus = revalidateItem(editValues);
    setLocalItems((prev) =>
      prev.map((item) =>
        item._id === editingId
          ? ({
              ...item,
              ...editValues,
              status: newStatus,
              error: undefined,
            } as IndexedItem)
          : item,
      ),
    );
    setEditingId(null);
    setEditValues({});
  };

  const handleDelete = (id: number) => {
    setLocalItems((prev) => prev.filter((i) => i._id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditValues({});
    }
  };

  const handleSubmitClick = () => {
    if (transactionType === "sale" || transactionType === "salesReturn") {
      setShowCalcPanel(true);
    } else {
      openConfirm(null);
    }
  };

  const openConfirm = (calc: SavedCalc | null) => {
    setSavedCalc(calc);
    addBatchTransactions.reset();
    setShowCalcPanel(false);
    setShowConfirmDialog(true);
  };

  const handleCalcSkip = () => {
    openConfirm(null);
  };

  const handleCalcSave = () => {
    openConfirm({
      stonePurity: calcState.stonePurity,
      nonStonePurity: calcState.nonStonePurity,
      stoneChargePerGram: calcState.stoneChargePerGram,
    });
  };

  // Compute per-item metalBalance and cashBalance directly from individual item weights
  function getItemCalcValues(item: IndexedItem): {
    metalPurity: number | undefined;
    metalBalance: number | undefined;
    cashBalance: number | undefined;
    stoneChargePerGram: number | undefined;
  } {
    if (!savedCalc) {
      return {
        metalPurity: undefined,
        metalBalance: undefined,
        cashBalance: undefined,
        stoneChargePerGram: undefined,
      };
    }
    const isStone = (item.stoneWeight ?? 0) > 0;
    const purity = isStone ? savedCalc.stonePurity : savedCalc.nonStonePurity;
    const nw = item.netWeight ?? 0;
    const sw = item.stoneWeight ?? 0;
    const metalBalance = (nw * purity) / 100;
    const cashBalance = isStone ? sw * savedCalc.stoneChargePerGram : 0;
    return {
      metalPurity: purity,
      metalBalance,
      cashBalance: cashBalance > 0 ? cashBalance : undefined,
      stoneChargePerGram:
        savedCalc.stoneChargePerGram > 0
          ? savedCalc.stoneChargePerGram
          : undefined,
    };
  }

  const handleConfirm = async () => {
    try {
      const itemTypeMap: Record<string, ItemType> = {
        sale: ItemType.sale,
        purchase: ItemType.purchase,
        purchaseReturn: ItemType.purchaseReturn,
        salesReturn: ItemType.salesReturn,
      };
      const itemType = itemTypeMap[transactionType];
      const timestamp = BigInt(Date.now()) * BigInt(1_000_000);

      // Make every item code unique so duplicates do not overwrite in backend Map
      const codeCountTotal = new Map<string, number>();
      for (const item of validItems) {
        codeCountTotal.set(item.code, (codeCountTotal.get(item.code) ?? 0) + 1);
      }
      const codeIdx = new Map<string, number>();
      const uniqueValidItems = validItems.map((item) => {
        const total = codeCountTotal.get(item.code) ?? 1;
        if (total === 1) return item;
        const idx = (codeIdx.get(item.code) ?? 0) + 1;
        codeIdx.set(item.code, idx);
        return { ...item, code: `${item.code}#${idx}` };
      });

      await addBatchTransactions.mutateAsync(
        uniqueValidItems.map((item) => {
          const calc = getItemCalcValues(item);
          const trimmedCustomer = customerName?.trim();
          const txInput: TransactionInput = {
            code: item.code,
            transactionType: itemType,
            timestamp,
            quantity: BigInt(item.pieces ?? 0),
            netWeight: item.netWeight ?? 0,
            grossWeight: item.grossWeight ?? 0,
            stoneWeight: item.stoneWeight ?? 0,
            transactionCode: item.code,
            ...(trimmedCustomer ? { customerName: trimmedCustomer } : {}),
            ...(calc.metalPurity != null
              ? { metalPurity: calc.metalPurity }
              : {}),
            ...(calc.metalBalance != null
              ? { metalBalance: calc.metalBalance }
              : {}),
            ...(calc.stoneChargePerGram != null
              ? { stoneChargePerGram: calc.stoneChargePerGram }
              : {}),
            ...(calc.cashBalance != null
              ? { cashBalance: calc.cashBalance }
              : {}),
          };
          return txInput;
        }),
      );

      // Save staff name for each transaction code
      if (staffName) {
        try {
          const records = JSON.parse(
            localStorage.getItem("jewel_staff_records") || "{}",
          ) as Record<string, string>;
          for (const item of uniqueValidItems) {
            records[item.code] = staffName;
          }
          localStorage.setItem("jewel_staff_records", JSON.stringify(records));
        } catch {}
      }

      setShowConfirmDialog(false);
      onConfirm?.();
    } catch (err) {
      console.error("Transaction failed:", err);
    }
  };

  const isSubmitting = addBatchTransactions.isPending;
  const hasError = addBatchTransactions.isError;

  // Preview totals for confirm dialog
  const confirmTotalMetal = savedCalc
    ? validItems.reduce((s, item) => {
        const isStone = (item.stoneWeight ?? 0) > 0;
        const purity = isStone
          ? savedCalc.stonePurity
          : savedCalc.nonStonePurity;
        return s + ((item.netWeight ?? 0) * purity) / 100;
      }, 0)
    : null;
  const confirmTotalCash = savedCalc
    ? validItems.reduce((s, item) => {
        const isStone = (item.stoneWeight ?? 0) > 0;
        if (!isStone) return s;
        return s + (item.stoneWeight ?? 0) * savedCalc.stoneChargePerGram;
      }, 0)
    : null;

  const typeLabel =
    transactionType === "sale"
      ? "Sale"
      : transactionType === "purchase"
        ? "Purchase"
        : transactionType === "purchaseReturn"
          ? "Purchase Return"
          : "Sales Return";

  const typeColor =
    transactionType === "sale"
      ? "text-success"
      : transactionType === "purchase"
        ? "text-primary"
        : "text-warning";

  const typeBg =
    transactionType === "sale"
      ? "bg-success/10 border-success/20"
      : transactionType === "purchase"
        ? "bg-primary/10 border-primary/20"
        : "bg-warning/10 border-warning/20";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground">
            Transaction Preview
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {validItems.length} valid
            {issueItems.length > 0 && (
              <span className="text-warning font-medium">
                {" "}
                · {issueItems.length} with issues
              </span>
            )}
            {customerName && ` · ${customerName}`}
          </p>
        </div>
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${typeBg} ${typeColor}`}
        >
          {typeLabel}
        </div>
      </div>

      {/* Submit button at the TOP */}
      {!showConfirmDialog && !showCalcPanel && (
        <div className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-xl shadow-soft">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {validItems.length} item{validItems.length !== 1 ? "s" : ""} ready
            </span>
            {issueItems.length > 0 && (
              <span className="text-xs text-warning flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3 h-3" />
                Fix {issueItems.length} issue
                {issueItems.length !== 1 ? "s" : ""} below before submitting
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="gap-1.5"
              data-ocid="preview.cancel_button"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmitClick}
              disabled={validItems.length === 0}
              size="sm"
              className="gap-1.5"
              data-ocid="preview.submit_button"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Submit {validItems.length} Item
              {validItems.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}

      {/* Sale Calculation Panel */}
      {showCalcPanel &&
        (transactionType === "sale" || transactionType === "salesReturn") && (
          <div
            className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 space-y-5"
            data-ocid="preview.panel"
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-base text-foreground">
                Sale Calculation
              </h3>
              <span className="text-xs text-muted-foreground ml-1">
                (optional — skip to confirm directly)
              </span>
            </div>

            {/* Stone Items Group */}
            {stoneItems.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-amber-800">
                  Stone Items ({stoneItems.length} items)
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center border border-amber-100">
                    <p className="text-xs text-muted-foreground mb-1">
                      Total GW
                    </p>
                    <p className="font-bold text-foreground">
                      {stoneTotals.gw.toFixed(3)}g
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-amber-100">
                    <p className="text-xs text-muted-foreground mb-1">
                      Total SW
                    </p>
                    <p className="font-bold text-amber-600">
                      {stoneTotals.sw.toFixed(3)}g
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-amber-100">
                    <p className="text-xs text-muted-foreground mb-1">
                      Total NW
                    </p>
                    <p className="font-bold text-foreground">
                      {stoneTotals.nw.toFixed(3)}g
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-amber-800">
                      Metal Purity % (95–100)
                    </Label>
                    <Input
                      type="number"
                      min={95}
                      max={100}
                      step={0.01}
                      value={calcState.stonePurity}
                      onChange={(e) =>
                        setCalcState((p) => ({
                          ...p,
                          stonePurity: Number(e.target.value),
                        }))
                      }
                      className="h-9"
                    />
                    <p className="text-xs text-muted-foreground">
                      Metal Balance:{" "}
                      <strong>{stoneMetalBalance.toFixed(3)}g</strong>
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-amber-800">
                      Stone Charge (Rs/gm)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={calcState.stoneChargePerGram}
                      onChange={(e) =>
                        setCalcState((p) => ({
                          ...p,
                          stoneChargePerGram: Number(e.target.value),
                        }))
                      }
                      className="h-9"
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Cash Balance:{" "}
                      <strong>₹{stoneCashBalance.toFixed(2)}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Non-Stone Items Group */}
            {nonStoneItems.length > 0 && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-primary">
                  Plain Items ({nonStoneItems.length} items)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">
                      Total GW
                    </p>
                    <p className="font-bold text-foreground">
                      {nonStoneTotals.gw.toFixed(3)}g
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">
                      Total NW
                    </p>
                    <p className="font-bold text-foreground">
                      {nonStoneTotals.nw.toFixed(3)}g
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-primary">
                    Metal Purity % (95–100)
                  </Label>
                  <Input
                    type="number"
                    min={95}
                    max={100}
                    step={0.01}
                    value={calcState.nonStonePurity}
                    onChange={(e) =>
                      setCalcState((p) => ({
                        ...p,
                        nonStonePurity: Number(e.target.value),
                      }))
                    }
                    className="h-9 max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Metal Balance:{" "}
                    <strong>{nonStoneMetalBalance.toFixed(3)}g</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="rounded-xl bg-gradient-to-r from-primary/10 to-success/10 border border-primary/20 p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Summary
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total Metal Balance
                  </p>
                  <p className="text-lg font-display font-bold text-primary">
                    {(stoneMetalBalance + nonStoneMetalBalance).toFixed(3)}g
                  </p>
                </div>
                {stoneItems.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Cash Balance (Stone)
                    </p>
                    <p className="text-lg font-display font-bold text-amber-600">
                      ₹{stoneCashBalance.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCalcSkip}
                className="flex-1 gap-2"
                data-ocid="preview.cancel_button"
              >
                <SkipForward className="w-4 h-4" />
                Skip & Confirm
              </Button>
              <Button
                onClick={handleCalcSave}
                className="flex-1 gap-2 bg-primary"
                data-ocid="preview.confirm_button"
              >
                <Check className="w-4 h-4" />
                Save & Confirm
              </Button>
            </div>
          </div>
        )}

      {/* Issues banner */}
      {issueItems.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {issueItems.length} row{issueItems.length !== 1 ? "s" : ""} with
            issues are shown at the top — edit them to make them valid.
          </span>
        </div>
      )}

      {/* Items Table */}
      <div className="rounded-xl border border-border overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/60 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">
                  Code
                </th>
                <th className="text-right px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">
                  GW
                </th>
                <th className="text-right px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">
                  SW
                </th>
                <th className="text-right px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">
                  NW
                </th>
                <th className="text-right px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">
                  PCS
                </th>
                <th className="text-right px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedItems.map((item) => {
                const isEditing = editingId === item._id;
                const isIssue = item.status !== "VALID";
                return (
                  <tr
                    key={item._id}
                    className={`transition-colors ${
                      item.status === "VALID"
                        ? "hover:bg-secondary/30"
                        : item.status === "MISTAKE"
                          ? "bg-warning/5 hover:bg-warning/10 border-l-2 border-l-warning"
                          : "bg-destructive/5 hover:bg-destructive/10 border-l-2 border-l-destructive"
                    }`}
                  >
                    <td className="px-4 py-3">
                      {item.status === "VALID" ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : item.status === "MISTAKE" ? (
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                    </td>
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2">
                          <Input
                            value={editValues.code || ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                code: e.target.value,
                              })
                            }
                            className="h-7 text-xs w-28"
                            autoFocus={isIssue}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={editValues.grossWeight ?? ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                grossWeight: Number.parseFloat(e.target.value),
                              })
                            }
                            className="h-7 text-xs w-20"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={editValues.stoneWeight ?? ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                stoneWeight: Number.parseFloat(e.target.value),
                              })
                            }
                            className="h-7 text-xs w-20"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={editValues.netWeight ?? ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                netWeight: Number.parseFloat(e.target.value),
                              })
                            }
                            className="h-7 text-xs w-20"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={editValues.pieces ?? ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                pieces: Number.parseInt(e.target.value),
                              })
                            }
                            className="h-7 text-xs w-16"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-success hover:bg-success/10"
                              onClick={handleSaveEdit}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                              onClick={() => {
                                setEditingId(null);
                                setEditValues({});
                              }}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                          {item.code}
                          {isIssue && (item.error || item.rawString) && (
                            <div className="mt-0.5">
                              {item.error && (
                                <p className="text-warning text-xs font-normal font-sans leading-tight">
                                  {item.error}
                                </p>
                              )}
                              {item.rawString && (
                                <p
                                  className="text-muted-foreground text-xs font-mono leading-tight mt-0.5 truncate max-w-[200px]"
                                  title={item.rawString}
                                >
                                  Raw: {item.rawString}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {item.grossWeight?.toFixed(3) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {item.stoneWeight?.toFixed(3) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {item.netWeight?.toFixed(3) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {item.pieces ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className={`h-7 w-7 ${
                                isIssue
                                  ? "text-warning hover:text-warning hover:bg-warning/10"
                                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                              }`}
                              onClick={() => handleEdit(item._id)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(item._id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total GW",
            value: totals.grossWeight.toFixed(3),
            unit: "g",
          },
          {
            label: "Total SW",
            value: totals.stoneWeight.toFixed(3),
            unit: "g",
          },
          { label: "Total NW", value: totals.netWeight.toFixed(3), unit: "g" },
          { label: "Total PCS", value: totals.pieces.toString(), unit: "" },
        ].map(({ label, value, unit }) => (
          <div key={label} className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {label}
            </p>
            <p className="text-base font-display font-bold text-foreground">
              {value}
              {unit}
            </p>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {typeLabel} Transaction</DialogTitle>
            <DialogDescription>
              You are about to submit {validItems.length} item
              {validItems.length !== 1 ? "s" : ""} as a{" "}
              <strong>{typeLabel}</strong> transaction.
              {customerName && ` Customer: ${customerName}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Items
              </p>
              <p className="text-xl font-bold font-display">{totals.count}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Total NW
              </p>
              <p className="text-xl font-bold font-display">
                {totals.netWeight.toFixed(3)}g
              </p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Total GW
              </p>
              <p className="text-xl font-bold font-display">
                {totals.grossWeight.toFixed(3)}g
              </p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Total PCS
              </p>
              <p className="text-xl font-bold font-display">{totals.pieces}</p>
            </div>
            {confirmTotalMetal != null && (
              <div className="bg-primary/10 rounded-xl p-3">
                <p className="text-xs text-primary uppercase tracking-wide mb-1">
                  Total Metal Balance
                </p>
                <p className="text-xl font-bold font-display text-primary">
                  {confirmTotalMetal.toFixed(3)}g
                </p>
              </div>
            )}
            {confirmTotalCash != null && confirmTotalCash > 0 && (
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs text-amber-700 uppercase tracking-wide mb-1">
                  Cash Balance
                </p>
                <p className="text-xl font-bold font-display text-amber-700">
                  ₹{confirmTotalCash.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {hasError && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium"
              data-ocid="preview.error_state"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              <span>
                Transaction failed:{" "}
                {addBatchTransactions.error instanceof Error
                  ? addBatchTransactions.error.message
                  : "Please try again."}
              </span>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
              data-ocid="preview.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="gap-2"
              data-ocid="preview.confirm_button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm {typeLabel}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
