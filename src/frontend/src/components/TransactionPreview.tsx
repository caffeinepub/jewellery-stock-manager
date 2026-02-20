import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { ItemType } from '../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Edit2, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type { ParsedItem } from '../utils/scannerParser';

interface TransactionPreviewProps {
  items: ParsedItem[];
  transactionType: ItemType;
  onComplete: () => void;
  onItemsChange: (items: ParsedItem[]) => void;
  isPurchaseReturn?: boolean;
  isSalesReturn?: boolean;
}

export default function TransactionPreview({
  items,
  transactionType,
  onComplete,
  onItemsChange,
  isPurchaseReturn,
  isSalesReturn,
}: TransactionPreviewProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<Set<number>>(
    new Set(items.map((_, i) => i).filter((i) => items[i].status === 'VALID'))
  );
  const [customerName, setCustomerName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<ParsedItem>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const needsCustomerName = transactionType === ItemType.sale || isSalesReturn;

  // Calculate totals for selected valid items
  const totals = items
    .filter((item, i) => selectedItems.has(i) && item.status === 'VALID')
    .reduce(
      (acc, item) => ({
        totalGW: acc.totalGW + (item.grossWeight || 0),
        totalPCS: acc.totalPCS + (item.pieces || 0),
      }),
      { totalGW: 0, totalPCS: 0 }
    );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');

      const itemsToProcess = items.filter((item, i) => selectedItems.has(i) && item.status === 'VALID');

      // Create customer if name provided
      if (needsCustomerName && customerName.trim()) {
        try {
          await actor.createCustomer(customerName.trim());
        } catch (error) {
          // Customer might already exist, continue
        }
      }

      // Add items and create transactions
      for (const item of itemsToProcess) {
        await actor.addItem(
          item.code,
          item.grossWeight!,
          item.stoneWeight!,
          item.netWeight!,
          BigInt(item.pieces!),
          transactionType
        );
      }

      // Batch transactions
      const batchData = itemsToProcess.map((item) => ({
        code: item.code,
        transactionType,
        timestamp: BigInt(Date.now() * 1000000),
      }));

      if (batchData.length > 0) {
        await actor.addBatchTransactions(batchData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['availableStock'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['factory'] });
      toast.success(`Successfully processed ${selectedItems.size} items`);
      setShowConfirmDialog(false);
      onComplete();
    },
    onError: (error) => {
      toast.error(`Failed to process transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const handleSubmitClick = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one valid item');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = () => {
    mutation.mutate();
  };

  const toggleItem = (index: number) => {
    const item = items[index];
    if (item.status !== 'VALID') return;

    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const startEdit = (index: number) => {
    const item = items[index];
    setEditingIndex(index);
    setEditValues({
      code: item.code,
      grossWeight: item.grossWeight,
      stoneWeight: item.stoneWeight,
      netWeight: item.netWeight,
      pieces: item.pieces,
    });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValues({});
  };

  const saveEdit = (index: number) => {
    const gw = editValues.grossWeight!;
    const sw = editValues.stoneWeight!;
    const nw = editValues.netWeight!;

    // Validate
    const tolerance = 0.001;
    const isValid = Math.abs(gw - sw - nw) < tolerance;

    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      code: editValues.code!,
      grossWeight: gw,
      stoneWeight: sw,
      netWeight: nw,
      pieces: editValues.pieces!,
      status: isValid ? 'VALID' : 'MISTAKE',
      error: isValid ? undefined : 'GW - SW ≠ NW',
    };

    onItemsChange(updatedItems);
    setEditingIndex(null);
    setEditValues({});
  };

  const deleteItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
    const newSelected = new Set(selectedItems);
    newSelected.delete(index);
    setSelectedItems(newSelected);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Valid
          </Badge>
        );
      case 'MISTAKE':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Warning
          </Badge>
        );
      case 'INVALID':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="mr-1 h-3 w-3" />
            Invalid
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Transaction Preview</CardTitle>
          <CardDescription>
            Review and edit items before submission. {selectedItems.size} of {items.length} items selected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">GW (g)</TableHead>
                  <TableHead className="text-right">SW (g)</TableHead>
                  <TableHead className="text-right">NW (g)</TableHead>
                  <TableHead className="text-right">PCS</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedItems.has(index)}
                        onChange={() => toggleItem(index)}
                        disabled={item.status !== 'VALID'}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableCell>
                    {editingIndex === index ? (
                      <>
                        <TableCell>
                          <Input
                            value={editValues.code || ''}
                            onChange={(e) => setEditValues({ ...editValues, code: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.001"
                            value={editValues.grossWeight ?? ''}
                            onChange={(e) => setEditValues({ ...editValues, grossWeight: parseFloat(e.target.value) })}
                            className="h-8 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.001"
                            value={editValues.stoneWeight ?? ''}
                            onChange={(e) => setEditValues({ ...editValues, stoneWeight: parseFloat(e.target.value) })}
                            className="h-8 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.001"
                            value={editValues.netWeight ?? ''}
                            onChange={(e) => setEditValues({ ...editValues, netWeight: parseFloat(e.target.value) })}
                            className="h-8 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={editValues.pieces ?? ''}
                            onChange={(e) => setEditValues({ ...editValues, pieces: parseInt(e.target.value) })}
                            className="h-8 text-right"
                          />
                        </TableCell>
                        <TableCell colSpan={2} className="text-right space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => saveEdit(index)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-mono">{item.code}</TableCell>
                        <TableCell className="text-right">{item.grossWeight?.toFixed(3)}</TableCell>
                        <TableCell className="text-right">{item.stoneWeight?.toFixed(3)}</TableCell>
                        <TableCell className="text-right">{item.netWeight?.toFixed(3)}</TableCell>
                        <TableCell className="text-right">{item.pieces}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(item.status)}
                            {item.error && <p className="text-xs text-red-600">{item.error}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(index)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteItem(index)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmitClick} disabled={mutation.isPending || selectedItems.size === 0}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Submit ${selectedItems.size} Items`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Transaction</DialogTitle>
            <DialogDescription>
              Please review the transaction details before submitting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Gross Weight</p>
                <p className="text-2xl font-bold">{totals.totalGW.toFixed(3)}g</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Pieces</p>
                <p className="text-2xl font-bold">{totals.totalPCS}</p>
              </div>
            </div>
            {needsCustomerName && (
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name (Optional)</Label>
                <Input
                  id="customer-name"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
