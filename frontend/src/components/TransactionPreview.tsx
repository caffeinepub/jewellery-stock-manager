import { useState, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAddBatchItems, useAddBatchTransactions } from '../hooks/useQueries';
import { ItemType } from '../backend';
import type { ParsedItem } from '../utils/scannerParser';

interface TransactionPreviewProps {
  items: ParsedItem[];
  transactionType: 'sale' | 'purchase' | 'purchaseReturn' | 'salesReturn';
  customerName?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// Internal type with stable ID for tracking edits across re-sorts
interface IndexedItem extends ParsedItem {
  _id: number;
}

/**
 * Re-validate an item's status based on its weight values.
 * GW = SW + NW (within floating point tolerance) → VALID
 * Weights present but equation fails → MISTAKE
 * Missing weights → INVALID
 */
function revalidateItem(item: Partial<ParsedItem>): 'VALID' | 'MISTAKE' | 'INVALID' {
  const gw = item.grossWeight;
  const sw = item.stoneWeight ?? 0;
  const nw = item.netWeight;

  if (gw == null || nw == null || !item.code?.trim()) return 'INVALID';

  // Use integer arithmetic (×1000) to avoid floating point issues
  const gwInt = Math.round(gw * 1000);
  const swInt = Math.round(sw * 1000);
  const nwInt = Math.round(nw * 1000);

  if (gwInt === swInt + nwInt) return 'VALID';
  return 'MISTAKE';
}

export default function TransactionPreview({
  items,
  transactionType,
  customerName,
  onConfirm,
  onCancel,
}: TransactionPreviewProps) {
  // Assign stable IDs on first render
  const [localItems, setLocalItems] = useState<IndexedItem[]>(() =>
    items.map((item, i) => ({ ...item, _id: i }))
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<ParsedItem>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const addBatchItems = useAddBatchItems();
  const addBatchTransactions = useAddBatchTransactions();

  const validItems = useMemo(
    () => localItems.filter((i) => i.status === 'VALID'),
    [localItems]
  );
  const issueItems = useMemo(
    () => localItems.filter((i) => i.status !== 'VALID'),
    [localItems]
  );

  // Sorted display: issues first, then valid items
  const sortedItems = useMemo(
    () => [...issueItems, ...validItems],
    [issueItems, validItems]
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
          ? ({ ...item, ...editValues, status: newStatus, error: undefined } as IndexedItem)
          : item
      )
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

  const handleOpenConfirm = () => {
    addBatchItems.reset();
    addBatchTransactions.reset();
    setShowConfirmDialog(true);
  };

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

      // Step 1: Add batch items
      await addBatchItems.mutateAsync(
        validItems.map((item) => [
          item.code,
          item.grossWeight ?? 0,
          item.stoneWeight ?? 0,
          item.netWeight ?? 0,
          BigInt(item.pieces ?? 0),
          itemType,
        ] as [string, number, number, number, bigint, ItemType])
      );

      // Step 2: Add batch transactions with full required fields
      await addBatchTransactions.mutateAsync(
        validItems.map((item) => ({
          code: item.code,
          transactionType: itemType,
          timestamp,
          customerName: customerName && customerName.trim() ? customerName.trim() : undefined,
          quantity: BigInt(item.pieces ?? 0),
          netWeight: item.netWeight ?? 0,
          transactionCode: item.code,
        }))
      );

      setShowConfirmDialog(false);
      onConfirm?.();
    } catch (err) {
      console.error('Transaction failed:', err);
    }
  };

  const isSubmitting = addBatchItems.isPending || addBatchTransactions.isPending;
  const hasError = addBatchItems.isError || addBatchTransactions.isError;

  const typeLabel =
    transactionType === 'sale'
      ? 'Sale'
      : transactionType === 'purchase'
      ? 'Purchase'
      : transactionType === 'purchaseReturn'
      ? 'Purchase Return'
      : 'Sales Return';

  const typeColor =
    transactionType === 'sale'
      ? 'text-success'
      : transactionType === 'purchase'
      ? 'text-primary'
      : 'text-warning';

  const typeBg =
    transactionType === 'sale'
      ? 'bg-success/10 border-success/20'
      : transactionType === 'purchase'
      ? 'bg-primary/10 border-primary/20'
      : 'bg-warning/10 border-warning/20';

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
              <span className="text-warning font-medium"> · {issueItems.length} with issues</span>
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

      {/* ── Submit button at the TOP — hidden when confirm dialog is open ── */}
      {!showConfirmDialog && (
        <div className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-xl shadow-soft">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {validItems.length} item{validItems.length !== 1 ? 's' : ''} ready
            </span>
            {issueItems.length > 0 && (
              <span className="text-xs text-warning flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3 h-3" />
                Fix {issueItems.length} issue{issueItems.length !== 1 ? 's' : ''} below before submitting
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onCancel} className="gap-1.5">
              <X className="w-3.5 h-3.5" />
              Cancel
            </Button>
            <Button
              onClick={handleOpenConfirm}
              disabled={validItems.length === 0}
              size="sm"
              className="gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Submit {validItems.length} Item{validItems.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}

      {/* Issues banner — shown only when there are issue rows */}
      {issueItems.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {issueItems.length} row{issueItems.length !== 1 ? 's' : ''} with issues are shown at the
            top — edit them to make them valid.
          </span>
        </div>
      )}

      {/* Items Table — issues sorted to top */}
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
                const isIssue = item.status !== 'VALID';
                return (
                  <tr
                    key={item._id}
                    className={`transition-colors ${
                      item.status === 'VALID'
                        ? 'hover:bg-secondary/30'
                        : item.status === 'MISTAKE'
                        ? 'bg-warning/5 hover:bg-warning/10 border-l-2 border-l-warning'
                        : 'bg-destructive/5 hover:bg-destructive/10 border-l-2 border-l-destructive'
                    }`}
                  >
                    <td className="px-4 py-3">
                      {item.status === 'VALID' ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : item.status === 'MISTAKE' ? (
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                    </td>
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2">
                          <Input
                            value={editValues.code || ''}
                            onChange={(e) =>
                              setEditValues({ ...editValues, code: e.target.value })
                            }
                            className="h-7 text-xs w-28"
                            autoFocus={isIssue}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={editValues.grossWeight ?? ''}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                grossWeight: parseFloat(e.target.value),
                              })
                            }
                            className="h-7 text-xs w-20"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={editValues.stoneWeight ?? ''}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                stoneWeight: parseFloat(e.target.value),
                              })
                            }
                            className="h-7 text-xs w-20"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={editValues.netWeight ?? ''}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                netWeight: parseFloat(e.target.value),
                              })
                            }
                            className="h-7 text-xs w-20"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={editValues.pieces ?? ''}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                pieces: parseInt(e.target.value),
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
                          {isIssue && item.error && (
                            <p className="text-warning text-xs font-normal font-sans mt-0.5 leading-tight">
                              {item.error}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {item.grossWeight?.toFixed(3) ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {item.stoneWeight?.toFixed(3) ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {item.netWeight?.toFixed(3) ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {item.pieces ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className={`h-7 w-7 ${
                                isIssue
                                  ? 'text-warning hover:text-warning hover:bg-warning/10'
                                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
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
          { label: 'Total GW', value: totals.grossWeight.toFixed(3), unit: 'g' },
          { label: 'Total SW', value: totals.stoneWeight.toFixed(3), unit: 'g' },
          { label: 'Total NW', value: totals.netWeight.toFixed(3), unit: 'g' },
          { label: 'Total PCS', value: totals.pieces.toString(), unit: '' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {label}
            </p>
            <p className="text-base font-display font-bold text-foreground">
              {value}{unit}
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
              You are about to submit {validItems.length} item{validItems.length !== 1 ? 's' : ''}{' '}
              as a <strong>{typeLabel}</strong> transaction.
              {customerName && ` Customer: ${customerName}.`}
            </DialogDescription>
          </DialogHeader>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Items</p>
              <p className="text-xl font-bold font-display">{totals.count}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total NW</p>
              <p className="text-xl font-bold font-display">{totals.netWeight.toFixed(3)}g</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total GW</p>
              <p className="text-xl font-bold font-display">{totals.grossWeight.toFixed(3)}g</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total PCS</p>
              <p className="text-xl font-bold font-display">{totals.pieces}</p>
            </div>
          </div>

          {hasError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>Transaction failed. Please try again.</span>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isSubmitting} className="gap-2">
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
